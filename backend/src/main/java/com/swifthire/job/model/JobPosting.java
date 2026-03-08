package com.swifthire.job.model;

import com.swifthire.user.model.Employer;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "job_postings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JobPosting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employer_id", nullable = false)
    private Employer employer;

    @OneToOne(mappedBy = "jobPosting")
    private HiringPrompt hiringPrompt;

    @Column(nullable = false)
    private String jobTitle;

    // Comma-separated extracted skill tags (e.g., "java,spring boot,lahore,night")
    @Column(columnDefinition = "TEXT", nullable = false)
    private String requiredSkills;

    private String location;
    private String shift;
    private Integer experienceYears;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private JobStatus status = JobStatus.OPEN;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum JobStatus {
        OPEN, CLOSED, ARCHIVED
    }
}
