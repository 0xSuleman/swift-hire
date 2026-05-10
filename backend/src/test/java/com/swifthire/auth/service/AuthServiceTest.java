package com.swifthire.auth.service;

import com.swifthire.auth.dto.LoginRequest;
import com.swifthire.auth.repository.PasswordResetTokenRepository;
import com.swifthire.auth.util.JwtUtil;
import com.swifthire.automation.service.EmailService;
import com.swifthire.user.model.AccountStatus;
import com.swifthire.user.model.Role;
import com.swifthire.user.model.User;
import com.swifthire.user.repository.AdminRepository;
import com.swifthire.user.repository.CandidateRepository;
import com.swifthire.user.repository.EmployerRepository;
import com.swifthire.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private CandidateRepository candidateRepository;
    @Mock private EmployerRepository employerRepository;
    @Mock private AdminRepository adminRepository;
    @Mock private PasswordResetTokenRepository resetTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtUtil jwtUtil;
    @Mock private UserDetailsServiceImpl userDetailsService;
    @Mock private EmailService emailService;

    @InjectMocks private AuthService authService;

    @Test
    void loginRejectsBannedUserBeforeAuthenticationManager() {
        LoginRequest request = loginRequest("blocked@swift.test");
        User user = verifiedUser(AccountStatus.BANNED);

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Your account has been banned. Please contact support.");

        verify(authenticationManager, never()).authenticate(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void loginRejectsDeactivatedUserBeforeAuthenticationManager() {
        LoginRequest request = loginRequest("inactive@swift.test");
        User user = verifiedUser(AccountStatus.DEACTIVATED);

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Your account is deactivated. Please contact support.");

        verify(authenticationManager, never()).authenticate(org.mockito.ArgumentMatchers.any());
    }

    private LoginRequest loginRequest(String email) {
        LoginRequest request = new LoginRequest();
        request.setEmail(email);
        request.setPassword("Password123!");
        return request;
    }

    private User verifiedUser(AccountStatus status) {
        return User.builder()
                .id(10L)
                .name("Test User")
                .email("test@swift.test")
                .password("encoded")
                .role(Role.CANDIDATE)
                .emailVerified(true)
                .accountStatus(status)
                .failedLoginAttempts(0)
                .build();
    }
}
