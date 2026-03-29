package com.swifthire.automation.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Properties;

/**
 * BE4 — Email Service (UC-04, UC-15)
 * NFR 3.7.1: ≥95% delivery reliability
 * NFR 3.7.2: retry up to 3 times on failure
 * Uses Gmail REST API over HTTPS (port 443) — works on Render/Railway free tier.
 */
@Slf4j
@Service
public class EmailService {

    private static final String GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
    private static final String TOKEN_URL       = "https://oauth2.googleapis.com/token";
    private static final DateTimeFormatter FMT  = DateTimeFormatter.ofPattern("EEE, MMM dd yyyy 'at' hh:mm a");

    private final HttpClient   httpClient    = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper  = new ObjectMapper();

    @Value("${google.sender.email}")
    private String senderEmail;

    @Value("${google.client.id}")
    private String clientId;

    @Value("${google.client.secret}")
    private String clientSecret;

    @Value("${google.refresh.token}")
    private String refreshToken;

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

    // UC-15: Reminder email
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

    // NFR 3.4.4: Email verification
    @Async
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public void sendVerificationEmail(String toEmail, String name, String verifyLink) {
        String subject = "Swift Hire — Verify Your Email";
        String body = String.format("""
                <h2>Welcome to Swift Hire, %s!</h2>
                <p>Please verify your email address to activate your account.</p>
                <p><a href="%s">Click here to verify your email</a></p>
                <p>This link expires in <strong>24 hours</strong>.</p>
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
                <p>This link expires in <strong>1 hour</strong>.</p>
                <p>— Swift Hire Team</p>
                """, name, resetLink);
        send(toEmail, subject, body);
    }

    private void send(String to, String subject, String htmlBody) {
        try {
            // Build MIME message using a dummy session (no SMTP transport used)
            Session session = Session.getInstance(new Properties());
            MimeMessage mimeMessage = new MimeMessage(session);
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(senderEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            // Encode message to Base64URL (Gmail API requirement)
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            mimeMessage.writeTo(buffer);
            String encodedEmail = Base64.getUrlEncoder().encodeToString(buffer.toByteArray());

            // Get fresh access token via refresh token
            String accessToken = fetchAccessToken();

            // POST to Gmail REST API
            Map<String, String> payload = new LinkedHashMap<>();
            payload.put("raw", encodedEmail);
            String json = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GMAIL_SEND_URL))
                    .header("Authorization", "Bearer " + accessToken)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Email sent to {} via Gmail API: {}", to, subject);
            } else {
                log.error("Gmail API error {}: {}", response.statusCode(), response.body());
                throw new RuntimeException("Gmail API returned " + response.statusCode());
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Email delivery failed.", e);
        }
    }

    private String fetchAccessToken() throws Exception {
        String form = "client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8)
                + "&client_secret=" + URLEncoder.encode(clientSecret, StandardCharsets.UTF_8)
                + "&refresh_token=" + URLEncoder.encode(refreshToken, StandardCharsets.UTF_8)
                + "&grant_type=refresh_token";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(TOKEN_URL))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Failed to fetch Gmail access token: " + response.body());
        }

        JsonNode json = objectMapper.readTree(response.body());
        return json.get("access_token").asText();
    }
}
