package com.swifthire.job.controller;

import com.swifthire.common.dto.ApiResponse;
import com.swifthire.job.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    // UC-02: Submit hiring prompt → creates JobPosting + runs ATS
    @PostMapping("/prompt")
    public ResponseEntity<ApiResponse<Object>> processPrompt(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {
        String prompt = body.get("prompt");
        var result = jobService.processHiringPrompt(userDetails.getUsername(), prompt);
        return ResponseEntity.ok(ApiResponse.ok("Job posting created. Candidates ranked.", result));
    }

    // UC-03: Get ranked candidates for a job posting
    @GetMapping("/{jobId}/candidates")
    public ResponseEntity<ApiResponse<Object>> getRecommendedCandidates(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long jobId,
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) Double minAtsScore,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String shift,
            @RequestParam(required = false) String applicationStatus) {
        return ResponseEntity.ok(ApiResponse.ok(jobService.getRankedCandidates(
                userDetails.getUsername(), jobId, skill, minAtsScore, minRating,
                location, shift, applicationStatus)));
    }

    // Get all job postings for employer
    @GetMapping
    public ResponseEntity<ApiResponse<Object>> getMyJobPostings(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(jobService.getJobPostingsForEmployer(userDetails.getUsername())));
    }

    // NFR 3.9.1: Update job posting
    @PutMapping("/{jobId}")
    public ResponseEntity<ApiResponse<Void>> updateJob(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long jobId,
            @RequestBody Map<String, String> updates) {
        jobService.updateJobPosting(userDetails.getUsername(), jobId, updates);
        return ResponseEntity.ok(ApiResponse.ok("Job posting updated.", null));
    }

    // NFR 3.9.1: Delete (archive) job posting
    @DeleteMapping("/{jobId}")
    public ResponseEntity<ApiResponse<Void>> deleteJob(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long jobId) {
        jobService.archiveJobPosting(userDetails.getUsername(), jobId);
        return ResponseEntity.ok(ApiResponse.ok("Job posting archived.", null));
    }

    // Close a job posting (OPEN → CLOSED)
    @PatchMapping("/{jobId}/status")
    public ResponseEntity<ApiResponse<Void>> updateJobStatus(
            @PathVariable Long jobId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        String status = body.getOrDefault("status", "").toUpperCase();
        if ("CLOSED".equals(status)) {
            jobService.closeJobPosting(userDetails.getUsername(), jobId);
            return ResponseEntity.ok(ApiResponse.ok("Job closed.", null));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Unsupported status."));
    }

    // UC-03 extended: Get all matched candidates with their derived application status
    @GetMapping("/{jobId}/application-statuses")
    public ResponseEntity<ApiResponse<Object>> getApplicationStatuses(
            @PathVariable Long jobId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok("OK",
                jobService.getCandidateApplicationStatuses(userDetails.getUsername(), jobId)));
    }

    @PatchMapping("/{jobId}/applications/{candidateId}/status")
    public ResponseEntity<ApiResponse<Object>> updateApplicationStatus(
            @PathVariable Long jobId,
            @PathVariable Long candidateId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok("Application status updated.",
                jobService.updateApplicationStatus(
                        userDetails.getUsername(), jobId, candidateId, body.get("status"))));
    }
}
