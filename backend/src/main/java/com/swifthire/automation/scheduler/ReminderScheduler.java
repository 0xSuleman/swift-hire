package com.swifthire.automation.scheduler;

import com.swifthire.automation.service.EmailService;
import com.swifthire.scheduling.model.InterviewSlot;
import com.swifthire.scheduling.repository.InterviewSlotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * BE4 — Cron Reminder Scheduler (UC-15)
 * Runs every hour. Checks for upcoming interviews at 7d / 3d / 1d thresholds.
 * NFR 3.7.4: send within ±5 min of scheduled reminder time
 * NFR 3.7.5: reminderSentXd flags prevent duplicate sends
 * NFR 3.7.3: logging for all notification events
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReminderScheduler {

    private final InterviewSlotRepository slotRepository;
    private final EmailService emailService;

    // Runs every hour on the hour
    @Scheduled(cron = "0 0 * * * *")
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
                notifyBothParties(slot, "7 days");
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
                notifyBothParties(slot, "3 days");
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
                notifyBothParties(slot, "1 day");
                slot.setReminderSent1d(true);
                slotRepository.save(slot);
            }
        }
    }

    private void notifyBothParties(InterviewSlot slot, String label) {
        String link = slot.getCalendlyLink();
        LocalDateTime time = slot.getStartTime();

        // Notify candidate
        emailService.sendInterviewReminder(
                slot.getCandidate().getUser().getEmail(),
                slot.getCandidate().getUser().getName(),
                time, link, label);

        // Notify employer (UC-15: both parties receive reminders)
        emailService.sendInterviewReminder(
                slot.getJobPosting().getEmployer().getUser().getEmail(),
                slot.getJobPosting().getEmployer().getUser().getName(),
                time, link, label);

        log.info("Sent {} reminder for slot id={}", label, slot.getId());
    }
}
