package com.swifthire.admin.controller;

import com.swifthire.admin.service.AdminService;
import com.swifthire.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.swifthire.automation.model.NotificationLog;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // UC-13: List users with optional filters (role, rating, status, search)
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Object>> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Double maxRating,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getUsers(role, maxRating, status, search)));
    }

    // UC-13: View single user detail
    @GetMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<Object>> getUserDetail(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getUserDetail(userId)));
    }

    // UC-13: Approve / Block / Delete — NFR 3.8.5: logs action to audit_logs
    @PutMapping("/users/{userId}/status")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable Long userId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        adminService.updateUserStatus(userId, body.get("action"), userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("User status updated successfully.", null));
    }

    // NFR 3.8.5: Retrieve audit log
    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<Object>> getAuditLogs() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAuditLogs()));
    }

    // UC-13: Permanently delete a user and all their data
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        adminService.deleteUser(userId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("User permanently deleted.", null));
    }

    // NFR 3.8.5: Delete a single audit log entry
    @DeleteMapping("/audit-logs/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAuditLog(@PathVariable Long id) {
        adminService.deleteAuditLog(id);
        return ResponseEntity.ok(ApiResponse.ok("Audit log entry deleted.", null));
    }

    // UC-14: Generate system report (ACD: generateGraphicalReport)
    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<Object>> getReport(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String category,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String userType,
            @RequestParam(required = false) Double atsThreshold) {
        return ResponseEntity.ok(ApiResponse.ok(
                adminService.generateReport(category, from, to, userType, atsThreshold, userDetails.getUsername())));
    }

    // UC-14 steps 13-14: Export report as CSV file download
    @GetMapping("/reports/export")
    public ResponseEntity<byte[]> exportReport(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String category,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String userType,
            @RequestParam(required = false) Double atsThreshold) {
        String csv = adminService.exportReportCsv(category, from, to, userType, atsThreshold, userDetails.getUsername());
        byte[] bytes = csv.getBytes();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "report-" + category + ".csv");
        return ResponseEntity.ok().headers(headers).body(bytes);
    }

    // UC-13: View interviews scheduled for a user
    @GetMapping("/users/{userId}/interviews")
    public ResponseEntity<ApiResponse<Object>> getUserInterviews(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getUserInterviews(userId)));
    }

    // UC-13: View reviews received by a user
    @GetMapping("/users/{userId}/reviews")
    public ResponseEntity<ApiResponse<Object>> getUserReviews(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getUserReviews(userId)));
    }

    // UC-13: View activity timeline for a user (derived from existing timestamps)
    @GetMapping("/users/{userId}/activity")
    public ResponseEntity<ApiResponse<Object>> getUserActivity(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getUserActivity(userId)));
    }

    // UC-14: View history of generated reports (ACD: Admin Views GraphicalReport 1:0..*)
    @GetMapping("/reports/history")
    public ResponseEntity<ApiResponse<Object>> getReportHistory(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getReportHistory(from, to)));
    }

    // Platform-wide analytics dashboard (no report history persistence)
    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<Object>> getAnalytics() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAdminAnalytics()));
    }

    @GetMapping("/notification-logs")
    public ResponseEntity<ApiResponse<List<NotificationLog>>> getNotificationLogs() {
        return ResponseEntity.ok(ApiResponse.ok("OK", adminService.getNotificationLogs()));
    }
}
