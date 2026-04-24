package com.swifthire.scheduling.service;

import com.swifthire.automation.service.EmailService;
import com.swifthire.job.model.JobPosting;
import com.swifthire.job.repository.JobPostingRepository;
import com.swifthire.scheduling.model.InterviewSlot;
import com.swifthire.scheduling.model.InterviewWindow;
import com.swifthire.scheduling.repository.InterviewSlotRepository;
import com.swifthire.user.model.Candidate;
import com.swifthire.user.repository.CandidateRepository;
import com.swifthire.user.repository.EmployerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * BE4 — Auto-Schedule Batch (UC-04)
 * Assigns selected candidates into 45-minute non-overlapping slots.
 */
@Service
@RequiredArgsConstructor
public class ScheduleService {

    private static final int SLOT_DURATION_MINUTES = 45;

    private final InterviewSlotRepository slotRepository;
    private final CandidateRepository candidateRepository;
    private final JobPostingRepository jobPostingRepository;
    private final EmployerRepository employerRepository;
    private final EmailService emailService;

    public record ScheduleResult(List<InterviewSlot> slots, boolean allEmailsSent) {}

    // Returns proposed slot times without persisting anything (used by preview endpoint)
    public List<Map<String, Object>> previewBatch(Long employerId,
                                                   LocalDateTime windowStart,
                                                   LocalDateTime windowEnd,
                                                   int candidateCount) {
        if (!windowEnd.isAfter(windowStart)) {
            throw new IllegalArgumentException("Invalid time range. End time must be after start time.");
        }
        long totalMinutes = Duration.between(windowStart, windowEnd).toMinutes();
        if (totalMinutes < SLOT_DURATION_MINUTES) {
            throw new IllegalArgumentException("Not enough time for 45-minute slots. Add a longer window.");
        }

        List<InterviewSlot> existingConflicts = slotRepository.findOverlappingSlotsByEmployer(
                employerId, windowStart, windowEnd);
        LocalDateTime cursor = windowStart;
        if (!existingConflicts.isEmpty()) {
            LocalDateTime latestEnd = existingConflicts.stream()
                    .map(InterviewSlot::getEndTime)
                    .max(LocalDateTime::compareTo)
                    .orElse(windowStart);
            cursor = latestEnd;
        }

        long remainingMinutes = Duration.between(cursor, windowEnd).toMinutes();
        if (remainingMinutes < (long) candidateCount * SLOT_DURATION_MINUTES) {
            throw new IllegalArgumentException(
                "Not enough time remaining in this window for " + candidateCount + " candidate(s). Please choose a later or longer window.");
        }

        List<Map<String, Object>> slots = new ArrayList<>();
        for (int i = 0; i < candidateCount; i++) {
            LocalDateTime slotEnd = cursor.plusMinutes(SLOT_DURATION_MINUTES);
            Map<String, Object> slot = new LinkedHashMap<>();
            slot.put("slotNumber", i + 1);
            slot.put("startTime",  cursor.toLocalTime().toString());
            slot.put("endTime",    slotEnd.toLocalTime().toString());
            slots.add(slot);
            cursor = slotEnd;
        }
        return slots;
    }

    @Transactional
    public ScheduleResult scheduleBatch(Long jobPostingId,
                                        List<Long> candidateIds,
                                        InterviewWindow window) {
        LocalDateTime windowStart = LocalDateTime.of(window.getDate(), window.getStartTime());
        LocalDateTime windowEnd   = LocalDateTime.of(window.getDate(), window.getEndTime());

        // Validate window
        if (!windowEnd.isAfter(windowStart)) {
            throw new IllegalArgumentException("Invalid time range. End time must be after start time.");
        }
        long totalMinutes = Duration.between(windowStart, windowEnd).toMinutes();
        if (totalMinutes < SLOT_DURATION_MINUTES) {
            throw new IllegalArgumentException(
                "Not enough time for 45-minute slots. Add a longer window.");
        }
        JobPosting job = jobPostingRepository.findById(jobPostingId)
                .orElseThrow(() -> new IllegalArgumentException("Job posting not found."));

        // Advance cursor past any existing employer slots that overlap the window start
        List<InterviewSlot> existingConflicts = slotRepository.findOverlappingSlotsByEmployer(
                window.getEmployer().getId(), windowStart, windowEnd);
        LocalDateTime cursor = windowStart;
        if (!existingConflicts.isEmpty()) {
            LocalDateTime latestEnd = existingConflicts.stream()
                    .map(InterviewSlot::getEndTime)
                    .max(LocalDateTime::compareTo)
                    .orElse(windowStart);
            cursor = latestEnd;
        }

        // Re-validate remaining time after advancing cursor
        long remainingMinutes = Duration.between(cursor, windowEnd).toMinutes();
        if (remainingMinutes < (long) candidateIds.size() * SLOT_DURATION_MINUTES) {
            throw new IllegalArgumentException(
                "Not enough time remaining in this window for " + candidateIds.size() + " candidate(s). Please choose a later or longer window.");
        }

        List<InterviewSlot> result = new ArrayList<>();
        boolean allEmailsSent = true;

        for (Long candidateId : candidateIds) {
            Candidate candidate = candidateRepository.findById(candidateId)
                    .orElseThrow(() -> new IllegalArgumentException("Candidate not found: " + candidateId));

            LocalDateTime slotEnd = cursor.plusMinutes(SLOT_DURATION_MINUTES);
            String link = "https://meet.jit.si/swift-hire-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);

            InterviewSlot slot = InterviewSlot.builder()
                    .window(window)
                    .candidate(candidate)
                    .jobPosting(job)
                    .startTime(cursor)
                    .endTime(slotEnd)
                    .calendlyLink(link)
                    .build();

            result.add(slotRepository.save(slot));

            // UC-04: send invitations synchronously so we know if they succeeded
            boolean candidateSent = emailService.trySendInvitation(candidate.getUser().getEmail(),
                    candidate.getUser().getName(), cursor, slotEnd, link);
            boolean employerSent  = emailService.trySendInvitation(window.getEmployer().getUser().getEmail(),
                    window.getEmployer().getUser().getName(), cursor, slotEnd, link);
            if (!candidateSent || !employerSent) allEmailsSent = false;

            cursor = slotEnd;
        }

        return new ScheduleResult(result, allEmailsSent);
    }
}
