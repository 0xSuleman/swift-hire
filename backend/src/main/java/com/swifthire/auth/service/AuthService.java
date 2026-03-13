package com.swifthire.auth.service;

import com.swifthire.auth.dto.LoginRequest;
import com.swifthire.auth.dto.LoginResponse;
import com.swifthire.auth.dto.SignupRequest;
import com.swifthire.auth.model.PasswordResetToken;
import com.swifthire.auth.repository.PasswordResetTokenRepository;
import com.swifthire.auth.util.JwtUtil;
import com.swifthire.automation.service.EmailService;
import com.swifthire.user.model.*;
import com.swifthire.user.repository.AdminRepository;
import com.swifthire.user.repository.CandidateRepository;
import com.swifthire.user.repository.EmployerRepository;
import com.swifthire.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CandidateRepository candidateRepository;
    private final EmployerRepository employerRepository;
    private final AdminRepository adminRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserDetailsServiceImpl userDetailsService;
    private final EmailService emailService;

    @Value("${app.security.max-failed-attempts}")
    private int maxFailedAttempts;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Transactional
    public void signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered. Retry.");
        }
        if (request.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Cannot self-register as Admin.");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNo(request.getPhoneNo())
                .role(request.getRole())
                .build();
        userRepository.save(user);

        if (request.getRole() == Role.CANDIDATE) {
            candidateRepository.save(Candidate.builder().user(user).build());
        } else if (request.getRole() == Role.EMPLOYER) {
            employerRepository.save(Employer.builder().user(user).build());
        } else if (request.getRole() == Role.ADMIN) {
            // ACD: Admin extends User — persist Admin row (JOINED table)
            Admin admin = new Admin();
            admin.setId(user.getId());
            adminRepository.save(admin);
        }
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password."));

        // NFR 3.8.4 — account lock check
        if (user.getFailedLoginAttempts() >= maxFailedAttempts) {
            user.setAccountStatus(AccountStatus.DEACTIVATED);
            userRepository.save(user);
            throw new IllegalArgumentException("Account is locked due to too many failed attempts.");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        } catch (BadCredentialsException ex) {
            user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
            userRepository.save(user);
            throw new BadCredentialsException("Invalid email or password.");
        }

        // Reset failed attempts on success
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        String token = jwtUtil.generateToken(user, user.getRole().name());
        return LoginResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    // NFR 3.8.3: Request password reset — generate token and email link
    @Transactional
    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No account found with that email."));

        // Remove any existing token for this user
        resetTokenRepository.deleteByUserId(user.getId());

        String token = UUID.randomUUID().toString();
        resetTokenRepository.save(PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build());

        String resetLink = frontendUrl + "/reset-password?token=" + token;
        emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetLink);
    }

    // NFR 3.8.3: Validate token and update password
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = resetTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset link."));

        if (resetToken.isUsed()) {
            throw new IllegalArgumentException("Reset link has already been used.");
        }
        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Reset link has expired. Please request a new one.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setFailedLoginAttempts(0);
        user.setAccountStatus(AccountStatus.ACTIVE);
        userRepository.save(user);

        resetToken.setUsed(true);
        resetTokenRepository.save(resetToken);
    }
}
