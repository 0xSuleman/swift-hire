package com.swifthire.employer.controller;

import com.swifthire.candidate.service.CandidateService;
import com.swifthire.common.dto.ApiResponse;
import com.swifthire.employer.service.EmployerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/employer")
@RequiredArgsConstructor
public class EmployerController {

    private final EmployerService employerService;
    private final CandidateService candidateService;

    // UC-17: View employer profile
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(employerService.getProfile(userDetails.getUsername())));
    }

    // UC-03: View candidate public profile
    @GetMapping("/candidates/{candidateId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCandidateProfile(
            @PathVariable Long candidateId) {
        return ResponseEntity.ok(ApiResponse.ok(candidateService.getCandidateProfileById(candidateId)));
    }

    // UC-17: Update employer profile
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Void>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> updates) {
        employerService.updateProfile(userDetails.getUsername(), updates);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully.", null));
    }
}
