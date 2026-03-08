package com.swifthire.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "Email and password are required.")
    @Email(message = "Enter a valid email address.")
    private String email;

    @NotBlank(message = "Email and password are required.")
    private String password;
}
