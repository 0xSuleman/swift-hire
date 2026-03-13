package com.swifthire.automation.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * BE4 — Email Service (UC-04, UC-15)
 * NFR 3.7.1: ≥95% delivery reliability
 * NFR 3.7.2: retry up to 3 times on failure
 * NFR 3.10.1: SMTP integration
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("EEE, MMM dd yyyy 'at' hh:mm a");

    // UC-04: Interview invitation email
    @Async
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public void sendInterviewInvitation(String toEmail, String name,
                                        LocalDateTime start, LocalDateTime end,
                                        String calendlyLink) {
        String subject = "Swift Hire — Interview Scheduled";
        String body = String.format("""
                <h2>Hello %s,</h2>
                <p>Your interview has been scheduled.</p>
                <p><strong>Date/Time:</strong> %s – %s</p>
                <p><strong>Meeting Link:</strong> <a href="%s">%s</a></p>
                <p>Good luck!</p>
                <p>— Swift Hire Team</p>
                """, name, start.format(FMT), end.format(FMT), calendlyLink, calendlyLink);
        send(toEmail, subject, body);
    }

    // UC-15: Reminder email to both candidate and employer
    @Async
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public void sendInterviewReminder(String toEmail, String name,
                                      LocalDateTime interviewTime, String calendlyLink,
                                      String daysLabel) {
        String subject = "Swift Hire — Interview Reminder (" + daysLabel + ")";
        String body = String.format("""
                <h2>Hello %s,</h2>
                <p>This is a reminder that your interview is <strong>%s</strong>.</p>
                <p><strong>Scheduled for:</strong> %s</p>
                <p><strong>Meeting Link:</strong> <a href="%s">%s</a></p>
                <p>— Swift Hire Team</p>
                """, name, daysLabel, interviewTime.format(FMT), calendlyLink, calendlyLink);
        send(toEmail, subject, body);
    }

    // NFR 3.8.3: Password reset email
    @Async
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public void sendPasswordResetEmail(String toEmail, String name, String resetLink) {
        String subject = "Swift Hire — Password Reset Request";
        String body = String.format("""
                <h2>Hello %s,</h2>
                <p>We received a request to reset your Swift Hire password.</p>
                <p><a href="%s">Click here to reset your password</a></p>
                <p>This link expires in <strong>1 hour</strong>. If you didn't request this, ignore this email.</p>
                <p>— Swift Hire Team</p>
                """, name, resetLink);
        send(toEmail, subject, body);
    }

    private void send(String to, String subject, String htmlBody) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(msg);
            log.info("Email sent to {}: {}", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Email delivery failed.", e);
        }
    }
}
