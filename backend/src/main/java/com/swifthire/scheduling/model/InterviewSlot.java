package com.swifthire.scheduling.model;

import com.swifthire.job.model.JobPosting;
import com.swifthire.user.model.Candidate;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "interview_slots")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InterviewSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "window_id", nullable = false)
    private InterviewWindow window;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_posting_id", nullable = false)
    private JobPosting jobPosting;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SlotStatus status = SlotStatus.PENDING;

    private String calendlyLink;

    // Reminder flags — prevent duplicate emails (NFR 3.7.5)
    @Builder.Default private boolean reminderSent7d = false;
    @Builder.Default private boolean reminderSent3d = false;
    @Builder.Default private boolean reminderSent1d = false;

    public enum SlotStatus {
        PENDING, CONFIRMED, CANCELLED, COMPLETED
    }
}
