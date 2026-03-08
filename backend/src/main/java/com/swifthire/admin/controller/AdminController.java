package com.swifthire.admin.controller;

import com.swifthire.admin.service.AdminService;
import com.swifthire.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // UC-13: List users with optional filters (role, rating, status)
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Object>> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Double maxRating,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getUsers(role, maxRating, status)));
    }

    // UC-13: View single user detail
    @GetMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<Object>> getUserDetail(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getUserDetail(userId)));
    }

    // UC-13: Approve / Block / Delete
    @PutMapping("/users/{userId}/status")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable Long userId,
            @RequestBody Map<String, String> body) {
        adminService.updateUserStatus(userId, body.get("action"));
        return ResponseEntity.ok(ApiResponse.ok("User status updated successfully.", null));
    }

    // UC-14: System reports
    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<Object>> getReport(
            @RequestParam String category,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String userType) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.generateReport(category, from, to, userType)));
    }
}
