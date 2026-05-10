package com.swifthire.scheduling.service;

import com.swifthire.application.model.ApplicationStatus;
import com.swifthire.application.service.ApplicationService;
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
    private final ApplicationService applicationService;

    public record ScheduleResult(List<InterviewSlot> slots, boolean allEmailsSent) {}

    // Returns proposed slot times without persisting anything (used by preview endpoint)
    public List<Map<String, Object>> previewBatch(Long employerId,
                                                   LocalDateTime windowStart,
                                                   LocalDateTime windowEnd,
                                                   List<Long> candidateIds) {
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
            cursor = existingConflicts.stream()
                    .map(InterviewSlot::getEndTime)
                    .max(LocalDateTime::compareTo)
                    .orElse(windowStart);
        }

        long remainingMinutes = Duration.between(cursor, windowEnd).toMinutes();
        if (remainingMinutes < (long) candidateIds.size() * SLOT_DURATION_MINUTES) {
            throw new IllegalArgumentException(!existingConflicts.isEmpty()
                ? "Selected time window is not available. Please choose a different time window."
                : "Not enough time for 45-minute slots. Add a longer window.");
        }

        List<Map<String, Object>> slots = new ArrayList<>();
        for (int i = 0; i < candidateIds.size(); i++) {
            Candidate candidate = candidateRepository.findById(candidateIds.get(i))
                    .orElseThrow(() -> new IllegalArgumentException("Candidate not found."));
            LocalDateTime slotEnd = cursor.plusMinutes(SLOT_DURATION_MINUTES);
            Map<String, Object> slot = new LinkedHashMap<>();
            slot.put("slotNumber",     i + 1);
            slot.put("startTime",      cursor.toLocalTime().toString());
            slot.put("endTime",        slotEnd.toLocalTime().toString());
            slot.put("candidateName",  candidate.getUser().getName());
            slot.put("candidateEmail", candidate.getUser().getEmail());
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

        List<InterviewSlot> existingConflicts = slotRepository.findOverlappingSlotsByEmployer(
                window.getEmployer().getId(), windowStart, windowEnd);
        LocalDateTime cursor = windowStart;
        if (!existingConflicts.isEmpty()) {
            cursor = existingConflicts.stream()
                    .map(InterviewSlot::getEndTime)
                    .max(LocalDateTime::compareTo)
                    .orElse(windowStart);
        }

        long remainingMinutes = Duration.between(cursor, windowEnd).toMinutes();
        if (remainingMinutes < (long) candidateIds.size() * SLOT_DURATION_MINUTES) {
            throw new IllegalArgumentException(!existingConflicts.isEmpty()
                ? "Selected time window is not available. Please choose a different time window."
                : "Not enough time for 45-minute slots. Add a longer window.");
        }

        List<InterviewSlot> result = new ArrayList<>();
        boolean allEmailsSent = true;

        for (Long candidateId : candidateIds) {
            Candidate candidate = candidateRepository.findById(candidateId)
                    .orElseThrow(() -> new IllegalArgumentException("Candidate not found: " + candidateId));

            if (slotRepository.existsByCandidateAndWindow_EmployerAndStatusNot(
                    candidate, window.getEmployer(), InterviewSlot.SlotStatus.CANCELLED)) {
                continue;
            }

            LocalDateTime slotEnd = cursor.plusMinutes(SLOT_DURATION_MINUTES);
            List<InterviewSlot> crossConflicts = slotRepository.findOverlappingSlotsByCandidate(
                    candidate.getId(), cursor, slotEnd);
            if (!crossConflicts.isEmpty()) {
                continue;
            }

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
            applicationService.changeStatus(candidate, job, ApplicationStatus.SCHEDULED,
                    window.getEmployer().getUser().getEmail(), "SCHEDULE_CREATED");

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
