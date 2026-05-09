package com.swifthire.candidate.controller;

import com.swifthire.candidate.service.CandidateService;
import com.swifthire.candidate.service.CvParserService;
import com.swifthire.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/candidate")
@RequiredArgsConstructor
public class CandidateController {

    private final CandidateService candidateService;
    private final CvParserService cvParserService;

    // UC-08: View profile
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(candidateService.getProfile(userDetails.getUsername())));
    }

    // UC-08: Update basic profile info
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Void>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> updates) {
        candidateService.updateProfile(userDetails.getUsername(), updates);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully.", null));
    }

    // UC-09: Upload CV (PDF only, ≤10MB)
    @PostMapping("/cv")
    public ResponseEntity<ApiResponse<Void>> uploadCv(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) throws IOException {
        cvParserService.validatePdf(file);
        candidateService.uploadAndParseCV(userDetails.getUsername(), file);
        return ResponseEntity.ok(ApiResponse.ok("CV uploaded and parsed successfully.", null));
    }

    // UC-10: Set preferences
    @PutMapping("/preferences")
    public ResponseEntity<ApiResponse<Void>> setPreferences(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> prefs) {
        candidateService.setPreferences(userDetails.getUsername(), prefs);
        return ResponseEntity.ok(ApiResponse.ok("Preferences saved.", null));
    }

    // UC-11: View filtered/ranked job postings
    @GetMapping("/job-postings")
    public ResponseEntity<ApiResponse<Object>> getJobPostings(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String shift,
            @RequestParam(required = false) Double minMatchScore,
            @RequestParam(required = false) String skill) {
        return ResponseEntity.ok(ApiResponse.ok(candidateService.getRecommendedJobs(
                userDetails.getUsername(), location, shift, minMatchScore, skill)));
    }

    // UC-11 extended: View all matched jobs with derived application status
    @GetMapping("/applications")
    public ResponseEntity<ApiResponse<Object>> getMyApplications(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok("OK",
                candidateService.getMyApplications(userDetails.getUsername())));
    }
}
