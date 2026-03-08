package com.swifthire.review.service;

import com.swifthire.common.exception.ResourceNotFoundException;
import com.swifthire.review.model.Review;
import com.swifthire.review.repository.ReviewRepository;
import com.swifthire.scheduling.model.InterviewSlot;
import com.swifthire.scheduling.repository.InterviewSlotRepository;
import com.swifthire.user.model.User;
import com.swifthire.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final InterviewSlotRepository slotRepository;
    private final UserRepository userRepository;

    // UC-05: Employer → Candidate
    @Transactional
    public void rateCandidate(String raterEmail, Long slotId, int rating, String comment) {
        validateRating(rating);
        User rater = findUser(raterEmail);
        InterviewSlot slot = findSlot(slotId);

        if (reviewRepository.findByRaterIdAndInterviewSlotId(rater.getId(), slotId).isPresent()) {
            throw new IllegalArgumentException("You have already rated this candidate for this interview.");
        }

        User ratee = slot.getCandidate().getUser();
        saveReview(rater, ratee, slot, rating, comment);
        recalculateRating(ratee);
    }

    // UC-12: Candidate → Employer
    @Transactional
    public void rateEmployer(String raterEmail, Long slotId, int rating, String comment) {
        validateRating(rating);
        User rater = findUser(raterEmail);
        InterviewSlot slot = findSlot(slotId);

        if (reviewRepository.findByRaterIdAndInterviewSlotId(rater.getId(), slotId).isPresent()) {
            throw new IllegalArgumentException("You have already submitted a rating for this interview.");
        }

        User ratee = slot.getJobPosting().getEmployer().getUser();
        saveReview(rater, ratee, slot, rating, comment);
        recalculateRating(ratee);
    }

    public List<Map<String, Object>> getReviewsForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        return reviewRepository.findByRatee(user).stream().map(r -> Map.of(
                "rating", r.getRatingValue(),
                "comment", r.getComment() != null ? r.getComment() : "",
                "raterName", r.getRater().getName(),
                "date", r.getCreatedAt().toString()
        )).toList();
    }

    private void saveReview(User rater, User ratee, InterviewSlot slot, int rating, String comment) {
        if (comment != null && comment.length() > 500) {
            throw new IllegalArgumentException("Invalid feedback — comment exceeds 500 characters.");
        }
        reviewRepository.save(Review.builder()
                .rater(rater).ratee(ratee)
                .interviewSlot(slot)
                .ratingValue(rating)
                .comment(comment)
                .build());
    }

    private void recalculateRating(User user) {
        double avg = reviewRepository.findAverageRatingByRateeId(user.getId()).orElse(0.0);
        long count = reviewRepository.countByRateeId(user.getId());
        user.setAverageRating(avg);
        user.setTotalRatings((int) count);
        userRepository.save(user);
    }

    private void validateRating(int rating) {
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Please select a valid rating (1–5).");
        }
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
    }

    private InterviewSlot findSlot(Long slotId) {
        return slotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview slot not found."));
    }
}
