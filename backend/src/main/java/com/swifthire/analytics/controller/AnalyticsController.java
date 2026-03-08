package com.swifthire.analytics.controller;

import com.swifthire.analytics.service.AnalyticsService;
import com.swifthire.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    // UC-16: Candidate analytics (profile views, interviews)
    @GetMapping("/candidate")
    public ResponseEntity<ApiResponse<Object>> candidateAnalytics(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(
                analyticsService.getCandidateAnalytics(userDetails.getUsername())));
    }

    // UC-16: Employer analytics (time-to-hire, acceptance rate)
    @GetMapping("/employer")
    public ResponseEntity<ApiResponse<Object>> employerAnalytics(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(
                analyticsService.getEmployerAnalytics(userDetails.getUsername())));
    }
}
