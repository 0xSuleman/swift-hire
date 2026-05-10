package com.swifthire.automation.scheduler;

import com.swifthire.application.model.ApplicationStatus;
import com.swifthire.application.service.ApplicationService;
import com.swifthire.automation.model.NotificationLog;
import com.swifthire.automation.repository.NotificationLogRepository;
import com.swifthire.automation.service.EmailService;
import com.swifthire.scheduling.model.InterviewSlot;
import com.swifthire.scheduling.repository.InterviewSlotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * BE4 — Cron Reminder Scheduler (UC-15)
 * Runs every hour. Checks for upcoming interviews at 7d / 3d / 1d thresholds.
 * NFR 3.7.3: all notification events (sent, failed) logged to DB via NotificationLog
 * NFR 3.7.4: send within ±5 min of scheduled reminder time
 * NFR 3.7.5: reminderSentXd flags prevent duplicate sends
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReminderScheduler {

    private final InterviewSlotRepository slotRepository;
    private final EmailService emailService;
    private final NotificationLogRepository notificationLogRepository;
    private final ApplicationService applicationService;

    // Auto-completes interviews whose end time has passed and are still PENDING or CONFIRMED
    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void autoCompleteExpiredInterviews() {
        LocalDateTime now = LocalDateTime.now();
        List<InterviewSlot> expired = slotRepository.findByEndTimeBeforeAndStatusIn(
                now, List.of(InterviewSlot.SlotStatus.PENDING, InterviewSlot.SlotStatus.CONFIRMED));
        for (InterviewSlot slot : expired) {
            slot.setStatus(InterviewSlot.SlotStatus.COMPLETED);
            slotRepository.save(slot);
            applicationService.changeStatus(slot.getCandidate(), slot.getJobPosting(),
                    ApplicationStatus.COMPLETED, null, "AUTO_COMPLETE");
            log.info("Auto-completed slot id={} for candidate={}",
                    slot.getId(), slot.getCandidate().getUser().getEmail());
        }
    }

    // Runs every minute — flags on each slot prevent duplicate sends
    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void sendReminders() {
        LocalDateTime now = LocalDateTime.now();
        log.info("ReminderScheduler triggered at {}", now);

        checkAndSend7Days(now);
        checkAndSend3Days(now);
        checkAndSend1Day(now);
    }

    private void checkAndSend7Days(LocalDateTime now) {
        LocalDateTime from = now.plusDays(7).minusMinutes(5);
        LocalDateTime to   = now.plusDays(7).plusMinutes(5);
        List<InterviewSlot> slots = slotRepository.findSlotsBetween(from, to);
        for (InterviewSlot slot : slots) {
            if (!slot.isReminderSent7d()) {
                notifyBothParties(slot, "7 days", "REMINDER_7D");
                slot.setReminderSent7d(true);
                slotRepository.save(slot);
            }
        }
    }

    private void checkAndSend3Days(LocalDateTime now) {
        LocalDateTime from = now.plusDays(3).minusMinutes(5);
        LocalDateTime to   = now.plusDays(3).plusMinutes(5);
        List<InterviewSlot> slots = slotRepository.findSlotsBetween(from, to);
        for (InterviewSlot slot : slots) {
            if (!slot.isReminderSent3d()) {
                notifyBothParties(slot, "3 days", "REMINDER_3D");
                slot.setReminderSent3d(true);
                slotRepository.save(slot);
            }
        }
    }

    private void checkAndSend1Day(LocalDateTime now) {
        LocalDateTime from = now.plusDays(1).minusMinutes(5);
        LocalDateTime to   = now.plusDays(1).plusMinutes(5);
        List<InterviewSlot> slots = slotRepository.findSlotsBetween(from, to);
        for (InterviewSlot slot : slots) {
            if (!slot.isReminderSent1d()) {
                notifyBothParties(slot, "1 day", "REMINDER_1D");
                slot.setReminderSent1d(true);
                slotRepository.save(slot);
            }
        }
    }

    private void notifyBothParties(InterviewSlot slot, String label, String eventType) {
        String link = slot.getCalendlyLink();
        LocalDateTime time = slot.getStartTime();

        sendAndLog(slot, slot.getCandidate().getUser().getEmail(),
                slot.getCandidate().getUser().getName(), time, link, label, eventType);

        sendAndLog(slot, slot.getJobPosting().getEmployer().getUser().getEmail(),
                slot.getJobPosting().getEmployer().getUser().getName(), time, link, label, eventType);
    }

    // NFR 3.7.3: log each send attempt to DB; on failure log error and continue
    private void sendAndLog(InterviewSlot slot, String email, String name,
                            LocalDateTime time, String link, String label, String eventType) {
        try {
            emailService.sendInterviewReminder(email, name, time, link, label);
            notificationLogRepository.save(NotificationLog.builder()
                    .recipientEmail(email)
                    .eventType(eventType)
                    .interviewSlotId(slot.getId())
                    .status("SENT")
                    .build());
            log.info("Sent {} reminder to {} for slot id={}", label, email, slot.getId());
        } catch (Exception e) {
            notificationLogRepository.save(NotificationLog.builder()
                    .recipientEmail(email)
                    .eventType(eventType)
                    .interviewSlotId(slot.getId())
                    .status("FAILED")
                    .errorMessage(e.getMessage())
                    .build());
            log.error("Failed {} reminder to {} for slot id={}: {}", label, email, slot.getId(), e.getMessage());
        }
    }
}
