package com.swifthire.review.controller;

import com.swifthire.common.dto.ApiResponse;
import com.swifthire.review.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    // UC-05: Employer rates candidate
    @PostMapping("/candidate")
    public ResponseEntity<ApiResponse<Void>> rateCandidate(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) {
        Long slotId = Long.valueOf(body.get("slotId").toString());
        int rating  = Integer.parseInt(body.get("rating").toString());
        String comment = (String) body.getOrDefault("comment", null);
        reviewService.rateCandidate(userDetails.getUsername(), slotId, rating, comment);
        return ResponseEntity.ok(ApiResponse.ok("Rating submitted successfully.", null));
    }

    // UC-12: Candidate rates employer
    @PostMapping("/employer")
    public ResponseEntity<ApiResponse<Void>> rateEmployer(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) {
        Long slotId = Long.valueOf(body.get("slotId").toString());
        int rating  = Integer.parseInt(body.get("rating").toString());
        String comment = (String) body.getOrDefault("comment", null);
        reviewService.rateEmployer(userDetails.getUsername(), slotId, rating, comment);
        return ResponseEntity.ok(ApiResponse.ok("Rating submitted successfully.", null));
    }

    // Get reviews for a specific user (employer profile page)
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<Object>> getReviewsForUser(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.getReviewsForUser(userId)));
    }
}
