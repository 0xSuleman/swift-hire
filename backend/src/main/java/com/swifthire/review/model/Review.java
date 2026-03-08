package com.swifthire.review.model;

import com.swifthire.scheduling.model.InterviewSlot;
import com.swifthire.user.model.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews",
       uniqueConstraints = @UniqueConstraint(columnNames = {"rater_id", "interview_slot_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rater_id", nullable = false)
    private User rater;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ratee_id", nullable = false)
    private User ratee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_slot_id", nullable = false)
    private InterviewSlot interviewSlot;

    @Column(nullable = false)
    private int ratingValue;  // 1–5

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
