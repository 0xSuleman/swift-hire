package com.swifthire.job.model;

import com.swifthire.user.model.Employer;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "hiring_prompts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class HiringPrompt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employer_id", nullable = false)
    private Employer employer;

    @OneToOne
    @JoinColumn(name = "job_posting_id")
    private JobPosting jobPosting;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String rawText;

    @Column(columnDefinition = "TEXT")
    private String parsedSkills;

    private String parsedLocation;
    private String parsedShift;
    private Integer parsedExperienceYears;

    @Column(updatable = false)
    private LocalDateTime submissionDate;

    @PrePersist
    protected void onCreate() {
        submissionDate = LocalDateTime.now();
    }
}
