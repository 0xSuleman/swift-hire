package com.swifthire.job.model;

import com.swifthire.user.model.Candidate;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "match_scores",
       uniqueConstraints = @UniqueConstraint(columnNames = {"candidate_id", "job_posting_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MatchScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_posting_id", nullable = false)
    private JobPosting jobPosting;

    // Percentage match (0.0 – 100.0)
    private double matchPercentage;

    // Rank within the job posting's candidate list (1 = best)
    private int ranking;
}
