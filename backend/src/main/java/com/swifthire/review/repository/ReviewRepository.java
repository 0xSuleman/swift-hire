package com.swifthire.review.repository;

import com.swifthire.review.model.Review;
import com.swifthire.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByRatee(User ratee);
    Optional<Review> findByRaterIdAndInterviewSlotId(Long raterId, Long slotId);

    @Query("SELECT AVG(r.ratingValue) FROM Review r WHERE r.ratee.id = :userId")
    Optional<Double> findAverageRatingByRateeId(Long userId);

    long countByRateeId(Long userId);
}
