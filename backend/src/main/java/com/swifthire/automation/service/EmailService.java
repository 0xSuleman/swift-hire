package com.swifthire.automation.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.swifthire.automation.model.NotificationLog;
import com.swifthire.automation.repository.NotificationLogRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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

    private final HttpClient   httpClient   = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private NotificationLogRepository notificationLogRepository;

    @Value("${google.sender.email}")
    private String senderEmail;

    @Value("${google.client.id}")
    private String clientId;

    @Value("${google.client.secret}")
    private String clientSecret;

    @Value("${google.refresh.token}")
    private String refreshToken;

    // ── Shared HTML wrapper ───────────────────────────────────────────────────
    private String wrap(String content) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
              <title>Swift Hire</title>
            </head>
            <body style="margin:0;padding:0;background:#0D0F11;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" border="0" style="background:#0D0F11;padding:40px 16px;">
                <tr><td align="center">
                  <table width="100%%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

                    <!-- Logo header -->
                    <tr>
                      <td align="center" style="padding-bottom:28px;">
                        <span style="font-size:24px;font-weight:900;letter-spacing:0.04em;text-transform:lowercase;">
                          <span style="color:#2EE5B0;">swift</span><span style="color:#E8EAF0;">hire</span>
                        </span>
                      </td>
                    </tr>

                    <!-- Card -->
                    <tr>
                      <td style="background:#13171B;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:36px 32px;box-shadow:0 24px 64px rgba(0,0,0,0.5);">

                        <!-- Teal top accent bar -->
                        <table width="100%%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                          <tr><td style="height:3px;background:linear-gradient(90deg,#2EE5B0,#00c9a7);border-radius:2px;"></td></tr>
                        </table>

                        %s

                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td align="center" style="padding-top:28px;">
                        <p style="margin:0;font-size:11px;color:#374151;">© 2026 Swift Hire. All Rights Reserved.</p>
                        <p style="margin:4px 0 0;font-size:11px;color:#374151;">This is an automated message — please do not reply.</p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(content);
    }

    private String tealButton(String href, String label) {
        return """
            <table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
              <tr>
                <td align="center" style="background:linear-gradient(135deg,#2EE5B0,#00c9a7);border-radius:9999px;padding:0;">
                  <a href="%s" style="display:inline-block;padding:14px 32px;color:#052015;font-size:15px;font-weight:700;text-decoration:none;border-radius:9999px;letter-spacing:0.01em;">%s</a>
                </td>
              </tr>
            </table>
            """.formatted(href, label);
    }

    private String heading(String text) {
        return "<h1 style=\"margin:0 0 12px;font-size:22px;font-weight:800;color:#E8EAF0;\">" + text + "</h1>";
    }

    private String subtext(String text) {
        return "<p style=\"margin:0 0 16px;font-size:14px;color:#9CA3AF;line-height:1.7;\">" + text + "</p>";
    }

    private String infoRow(String label, String value) {
        return """
            <tr>
              <td style="padding:10px 14px;font-size:13px;color:#6B7280;font-weight:500;border-bottom:1px solid rgba(255,255,255,0.05);">%s</td>
              <td style="padding:10px 14px;font-size:13px;color:#E8EAF0;font-weight:600;border-bottom:1px solid rgba(255,255,255,0.05);">%s</td>
            </tr>
            """.formatted(label, value);
    }

    private String infoTable(String rows) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0" border="0"
              style="background:#0D0F11;border:1px solid rgba(255,255,255,0.07);border-radius:10px;margin:20px 0;">
              <tbody>%s</tbody>
            </table>
            """.formatted(rows);
    }

    // UC-04: Synchronous invitation — returns true if sent, false on failure (used by batch scheduler)
    public boolean trySendInvitation(String toEmail, String name,
                                     LocalDateTime start, LocalDateTime end,
                                     String calendlyLink) {
        NotificationLog notifLog = notificationLogRepository.save(
                NotificationLog.builder()
                        .recipientEmail(toEmail)
                        .eventType("INVITATION")
                        .status("PENDING")
                        .build()
        );
        try {
            buildAndSendInvitation(toEmail, name, start, end, calendlyLink);
            notifLog.setStatus("SENT");
            notificationLogRepository.save(notifLog);
            return true;
        } catch (Exception e) {
            log.error("Invitation email failed for {}: {}", toEmail, e.getMessage());
            notifLog.setStatus("FAILED");
            notifLog.setErrorMessage(e.getMessage() != null
                    ? e.getMessage().substring(0, Math.min(e.getMessage().length(), 500))
                    : "Unknown error");
            notificationLogRepository.save(notifLog);
            return false;
        }
    }

    // UC-04: Interview invitation email (async — kept for ad-hoc/future use)
    @Async
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public void sendInterviewInvitation(String toEmail, String name,
                                        LocalDateTime start, LocalDateTime end,
                                        String calendlyLink) {
        buildAndSendInvitation(toEmail, name, start, end, calendlyLink);
    }

    private void buildAndSendInvitation(String toEmail, String name,
                                        LocalDateTime start, LocalDateTime end,
                                        String calendlyLink) {
        String subject = "Swift Hire — Your Interview is Scheduled";
        String content = heading("Interview Scheduled 🎉")
                + subtext("Hi <strong style=\"color:#E8EAF0;\">" + name + "</strong>, great news! Your interview has been scheduled. Here are the details:")
                + infoTable(
                    infoRow("Date &amp; Time", start.format(FMT) + " – " + end.format(DateTimeFormatter.ofPattern("hh:mm a")))
                  + infoRow("Platform", "Jitsi Meet (no download required)")
                  + infoRow("Meeting Link", "<a href=\"" + calendlyLink + "\" style=\"color:#2EE5B0;text-decoration:none;\">" + calendlyLink + "</a>")
                )
                + tealButton(calendlyLink, "Join Meeting")
                + subtext("If you have any questions, reach out to your employer through the Swift Hire platform.")
                + "<p style=\"margin:0;font-size:13px;color:#4B5563;\">Good luck! 🚀</p>";
        send(toEmail, subject, wrap(content));
    }

    // UC-15: Reminder email
    @Async
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public void sendInterviewReminder(String toEmail, String name,
                                      LocalDateTime interviewTime, String calendlyLink,
                                      String daysLabel) {
        String subject = "Swift Hire — Interview Reminder (" + daysLabel + ")";
        String content = heading("Reminder: Interview " + daysLabel)
                + subtext("Hi <strong style=\"color:#E8EAF0;\">" + name + "</strong>, this is a friendly reminder about your upcoming interview.")
                + infoTable(
                    infoRow("Scheduled For", interviewTime.format(FMT))
                  + infoRow("Platform", "Jitsi Meet")
                  + infoRow("Meeting Link", "<a href=\"" + calendlyLink + "\" style=\"color:#2EE5B0;text-decoration:none;\">" + calendlyLink + "</a>")
                )
                + tealButton(calendlyLink, "Join Meeting")
                + subtext("Make sure you're prepared and on time. Best of luck! 🌟");
        send(toEmail, subject, wrap(content));
    }

    // NFR 3.4.4: Email verification
    @Async
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public void sendVerificationEmail(String toEmail, String name, String verifyLink) {
        String subject = "Swift Hire — Verify Your Email Address";
        String content = heading("Verify Your Email")
                + subtext("Welcome to Swift Hire, <strong style=\"color:#E8EAF0;\">" + name + "</strong>! You're one step away from getting started.")
                + subtext("Click the button below to verify your email address and activate your account.")
                + tealButton(verifyLink, "Verify My Account")
                + "<p style=\"margin:16px 0 0;font-size:12px;color:#4B5563;\">This link expires in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.</p>";
        send(toEmail, subject, wrap(content));
    }

    // NFR 3.8.3: Password reset email
    @Async
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public void sendPasswordResetEmail(String toEmail, String name, String resetLink) {
        String subject = "Swift Hire — Password Reset Request";
        String content = heading("Reset Your Password")
                + subtext("Hi <strong style=\"color:#E8EAF0;\">" + name + "</strong>, we received a request to reset your Swift Hire password.")
                + tealButton(resetLink, "Reset My Password")
                + "<p style=\"margin:16px 0 0;font-size:12px;color:#4B5563;\">This link expires in <strong>1 hour</strong>. If you didn't request a password reset, please ignore this email — your account is safe.</p>";
        send(toEmail, subject, wrap(content));
    }

    // Hire flow: congratulations email to candidate
    @Async
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public void sendHireConfirmationToCandidate(String toEmail, String name,
                                                String companyName, String jobTitle,
                                                String employerEmail) {
        String subject = "Swift Hire — Congratulations, You've Been Hired!";
        String content = heading("You've Been Hired! 🎉")
                + subtext("Hi <strong style=\"color:#E8EAF0;\">" + name + "</strong>, congratulations! You have been selected for the following position:")
                + infoTable(
                    infoRow("Company",   companyName)
                  + infoRow("Role",      jobTitle)
                  + infoRow("Contact",   "<a href=\"mailto:" + employerEmail + "\" style=\"color:#2EE5B0;text-decoration:none;\">" + employerEmail + "</a>")
                )
                + subtext("Your employer will reach out with onboarding details. Check your inbox and get ready for your new journey!")
                + "<p style=\"margin:16px 0 0;font-size:13px;color:#4B5563;\">Best of luck in your new role! 🚀</p>";
        send(toEmail, subject, wrap(content));
    }

    // Hire flow: position-filled confirmation to employer
    @Async
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public void sendHireFillConfirmationToEmployer(String toEmail, String name,
                                                   String candidateName, String candidateEmail,
                                                   String jobTitle) {
        String subject = "Swift Hire — Position Filled";
        String content = heading("Position Filled ✅")
                + subtext("Hi <strong style=\"color:#E8EAF0;\">" + name + "</strong>, this is a confirmation that the following candidate has been successfully hired:")
                + infoTable(
                    infoRow("Candidate", candidateName)
                  + infoRow("Email",     "<a href=\"mailto:" + candidateEmail + "\" style=\"color:#2EE5B0;text-decoration:none;\">" + candidateEmail + "</a>")
                  + infoRow("Role",      jobTitle)
                )
                + subtext("The candidate has been removed from the active matching pool. You can reach them directly to begin the onboarding process.")
                + "<p style=\"margin:16px 0 0;font-size:13px;color:#4B5563;\">Thank you for hiring through Swift Hire!</p>";
        send(toEmail, subject, wrap(content));
    }

    private void send(String to, String subject, String htmlBody) {
        try {
            Session session = Session.getInstance(new Properties());
            MimeMessage mimeMessage = new MimeMessage(session);
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(senderEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            mimeMessage.writeTo(buffer);
            String encodedEmail = Base64.getUrlEncoder().encodeToString(buffer.toByteArray());

            String accessToken = fetchAccessToken();

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
