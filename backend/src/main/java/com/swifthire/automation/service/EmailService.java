package com.swifthire.automation.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * BE4 — Email Service (UC-04, UC-15)
 * NFR 3.7.1: ≥95% delivery reliability
 * NFR 3.7.2: retry up to 3 times on failure
 * Sends via Resend HTTP API (not SMTP) to work on Render free tier.
 */
@Slf4j
@Service
public class EmailService {

    private static final String RESEND_URL = "https://api.resend.com/emails";
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("EEE, MMM dd yyyy 'at' hh:mm a");

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${resend.api-key}")
    private String apiKey;

    @Value("${resend.from-email:onboarding@resend.dev}")
    private String fromEmail;

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

    // NFR 3.4.4: Email verification on signup
    @Async
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public void sendVerificationEmail(String toEmail, String name, String verifyLink) {
        String subject = "Swift Hire — Verify Your Email";
        String body = String.format("""
                <h2>Welcome to Swift Hire, %s!</h2>
                <p>Thank you for signing up. Please verify your email address to activate your account.</p>
                <p><a href="%s">Click here to verify your email</a></p>
                <p>This link expires in <strong>24 hours</strong>. If you didn't create an account, ignore this email.</p>
                <p>— Swift Hire Team</p>
                """, name, verifyLink);
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
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("from", fromEmail);
            payload.put("to", new String[]{to});
            payload.put("subject", subject);
            payload.put("html", htmlBody);

            String json = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(RESEND_URL))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Email sent to {} via Resend: {}", to, subject);
            } else {
                log.error("Resend API error {}: {}", response.statusCode(), response.body());
                throw new RuntimeException("Resend API returned " + response.statusCode());
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Email delivery failed.", e);
        }
    }
}
