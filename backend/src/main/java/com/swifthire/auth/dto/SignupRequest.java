package com.swifthire.auth.dto;

import com.swifthire.user.model.Role;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SignupRequest {

    @NotBlank(message = "Name is required.")
    private String name;

    @NotBlank(message = "Email is required.")
    @Email(message = "Enter a valid email address.")
    private String email;

    // NFR 3.8.2: min 8 chars, upper+lower+number+special
    @NotBlank(message = "Password is required.")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
        message = "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
    )
    private String password;

    @Pattern(
        regexp = "^\\+?[0-9\\s\\-]{7,15}$",
        message = "Enter a valid phone number (e.g. +92 300 1234567)."
    )
    private String phoneNo;

    @NotNull(message = "Role is required.")
    private Role role;   // CANDIDATE or EMPLOYER only (ADMIN is pre-seeded)
}
