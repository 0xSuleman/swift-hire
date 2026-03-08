package com.swifthire.auth.dto;

import com.swifthire.user.model.Role;
import lombok.Builder;
import lombok.Data;

@Data @Builder
public class LoginResponse {
    private String token;
    private Long userId;
    private String name;
    private String email;
    private Role role;
}
