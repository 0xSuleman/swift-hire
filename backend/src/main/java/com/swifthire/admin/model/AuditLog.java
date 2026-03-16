package com.swifthire.admin.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

// NFR 3.8.5 — Audit log for admin CRUD actions on user accounts
@Entity
@Table(name = "audit_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Email of the admin who performed the action
    @Column(nullable = false)
    private String adminEmail;

    // Action performed: APPROVE, BLOCK, DEACTIVATE
    @Column(nullable = false)
    private String action;

    // Target user's ID
    @Column(nullable = false)
    private Long targetUserId;

    // Target user's email (denormalized for audit readability)
    @Column(nullable = false)
    private String targetEmail;

    @Column(updatable = false)
    private LocalDateTime performedAt;

    @PrePersist
    protected void onCreate() {
        performedAt = LocalDateTime.now();
    }
}
