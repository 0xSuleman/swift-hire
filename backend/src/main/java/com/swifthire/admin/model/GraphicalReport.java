package com.swifthire.admin.model;

import com.swifthire.user.model.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

// ACD class: GraphicalReport — Admin Views 1:0..*
@Entity
@Table(name = "graphical_reports")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GraphicalReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ACD attribute: reportType
    @Column(nullable = false)
    private String reportType;  // users | jobs | ratings | analytics

    // ACD attribute: dateRange (stored as two fields for querying)
    private String dateRangeFrom;
    private String dateRangeTo;

    @Column(updatable = false)
    private LocalDateTime generatedAt;

    // Admin who generated this report (ACD: Admin Views GraphicalReport 1:0..*)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generated_by")
    private User generatedBy;

    // Aggregated result stored as JSON string
    @Column(columnDefinition = "TEXT")
    private String data;

    @PrePersist
    protected void onCreate() {
        generatedAt = LocalDateTime.now();
    }
}
