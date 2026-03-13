package com.swifthire.auth.service;

import com.swifthire.auth.dto.LoginRequest;
import com.swifthire.auth.dto.LoginResponse;
import com.swifthire.auth.dto.SignupRequest;
import com.swifthire.auth.util.JwtUtil;
import com.swifthire.user.model.*;
import com.swifthire.user.repository.AdminRepository;
import com.swifthire.user.repository.CandidateRepository;
import com.swifthire.user.repository.EmployerRepository;
import com.swifthire.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CandidateRepository candidateRepository;
    private final EmployerRepository employerRepository;
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserDetailsServiceImpl userDetailsService;

    @Value("${app.security.max-failed-attempts}")
    private int maxFailedAttempts;

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

    // TODO: implement password reset flow (NFR 3.8.3)
    public void requestPasswordReset(String email) {
        // 1. Lookup user by email
        // 2. Generate reset token (UUID), store with expiry
        // 3. Send reset link via EmailService
    }

    public void resetPassword(String token, String newPassword) {
        // 1. Validate token and expiry
        // 2. Hash new password and save
        // 3. Invalidate token
    }
}
