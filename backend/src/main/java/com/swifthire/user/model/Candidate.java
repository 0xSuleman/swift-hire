package com.swifthire.user.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "candidates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Candidate {

    @Id
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "id")
    private User user;

    // Path to stored PDF file on disk
    private String cvFilePath;

    // Comma-separated parsed skills from PDFBox (e.g., "java,spring boot,react")
    @Column(columnDefinition = "TEXT")
    private String parsedSkills;

    // Preferences stored as simple fields
    private String preferredLocation;
    private String preferredShift;   // DAY / NIGHT / ANY
    private String workType;         // REMOTE / ON_SITE / HYBRID

    @Builder.Default
    private long profileViews = 0L;

    // Hiring status — set when an employer marks this candidate as hired
    private LocalDateTime hiredAt;
    private String hiredCompanyName;
    private String hiredJobTitle;
    private String hiredEmployerEmail;

    // ACD attribute — derived from MatchScore (contextual per-job, not persisted)
    @Transient
    private double atsScore;
}
