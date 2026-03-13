package com.swifthire.automation.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * NFR 3.7.3: System shall log all notification events (sent, failed, retried) in the database.
 * UC-15: Post-condition — "Reminder status is logged in the system database."
 */
@Entity
@Table(name = "notification_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String recipientEmail;

    // e.g. "REMINDER_7D", "REMINDER_3D", "REMINDER_1D", "INVITATION"
    @Column(nullable = false)
    private String eventType;

    private Long interviewSlotId;

    // "SENT" or "FAILED"
    @Column(nullable = false)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    @Column(nullable = false)
    private LocalDateTime sentAt;

    @PrePersist
    protected void onCreate() {
        if (sentAt == null) sentAt = LocalDateTime.now();
    }
}
