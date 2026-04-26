package com.swifthire.scheduling.controller;

import com.swifthire.common.dto.ApiResponse;
import com.swifthire.review.repository.ReviewRepository;
import com.swifthire.scheduling.model.InterviewSlot;
import com.swifthire.scheduling.model.InterviewWindow;
import com.swifthire.scheduling.repository.InterviewWindowRepository;
import com.swifthire.scheduling.service.ScheduleService;
import com.swifthire.scheduling.repository.InterviewSlotRepository;
import com.swifthire.user.model.Employer;
import com.swifthire.user.model.Role;
import com.swifthire.user.repository.CandidateRepository;
import com.swifthire.user.repository.EmployerRepository;
import com.swifthire.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/schedule")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;
    private final InterviewWindowRepository windowRepository;
    private final InterviewSlotRepository slotRepository;
    private final EmployerRepository employerRepository;
    private final CandidateRepository candidateRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;

    // UC-04: Auto-Schedule Batch
    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<Object>> scheduleBatch(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) {

        Long jobPostingId = Long.valueOf(body.get("jobPostingId").toString());

        @SuppressWarnings("unchecked")
        List<Long> candidateIds = ((List<Object>) body.get("candidateIds"))
                .stream().map(o -> Long.valueOf(o.toString())).toList();

        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        Employer employer = employerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Employer not found."));

        LocalDate date      = LocalDate.parse(body.get("date").toString());
        LocalTime startTime = LocalTime.parse(body.get("startTime").toString());
        LocalTime endTime   = LocalTime.parse(body.get("endTime").toString());

        if (LocalDateTime.of(date, startTime).isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Interview window cannot be scheduled in the past.");
        }

        // Persist the window first — fixes TransientPropertyValueException (Bug #2)
        InterviewWindow window = InterviewWindow.builder()
                .employer(employer)
                .date(date)
                .startTime(startTime)
                .endTime(endTime)
                .build();
        windowRepository.save(window);

        ScheduleService.ScheduleResult result = scheduleService.scheduleBatch(jobPostingId, candidateIds, window);

        String message = result.allEmailsSent()
                ? "Schedule created. Invitations sent to " + result.slots().size() + " candidate(s)."
                : "Schedule created, but invitations could not be sent. Try again later.";

        return ResponseEntity.ok(ApiResponse.ok(message, result.slots().size()));
    }

    // UC-04: Preview proposed slots without saving (Step 6 in spec)
    @PostMapping("/preview")
    public ResponseEntity<ApiResponse<Object>> previewBatch(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) {

        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        Employer employer = employerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Employer not found."));

        LocalDate date      = LocalDate.parse(body.get("date").toString());
        LocalTime startTime = LocalTime.parse(body.get("startTime").toString());
        LocalTime endTime   = LocalTime.parse(body.get("endTime").toString());

        @SuppressWarnings("unchecked")
        List<Long> candidateIds = ((List<Object>) body.get("candidateIds"))
                .stream().map(o -> Long.valueOf(o.toString())).toList();

        LocalDateTime windowStart = LocalDateTime.of(date, startTime);
        LocalDateTime windowEnd   = LocalDateTime.of(date, endTime);

        if (windowStart.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Interview window cannot be scheduled in the past.");
        }

        var slots = scheduleService.previewBatch(employer.getId(), windowStart, windowEnd, candidateIds);
        return ResponseEntity.ok(ApiResponse.ok("Preview ready.", slots));
    }

    // UC-04 / UC-05 / UC-12: Return scheduled slots for the logged-in candidate or employer
    @GetMapping("/my-interviews")
    public ResponseEntity<ApiResponse<Object>> getMyInterviews(
            @AuthenticationPrincipal UserDetails userDetails) {

        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        List<Map<String, Object>> result;

        if (user.getRole() == Role.CANDIDATE) {
            var candidate = candidateRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Candidate profile not found."));
            result = slotRepository.findByCandidate(candidate).stream().map(s -> {
                var emp = s.getJobPosting().getEmployer();
                boolean hasReviewed = reviewRepository.findByRaterIdAndInterviewSlotId(user.getId(), s.getId()).isPresent();
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("slotId",          s.getId());
                m.put("jobTitle",        s.getJobPosting().getJobTitle());
                m.put("employer",        emp.getCompanyName());
                m.put("employerEmail",   emp.getUser().getEmail());
                m.put("companyLocation", emp.getCompanyLocation());
                m.put("startTime",       s.getStartTime().toString());
                m.put("endTime",         s.getEndTime().toString());
                m.put("status",          s.getStatus().name());
                m.put("calendlyLink",    s.getCalendlyLink());
                m.put("hasReviewed",     hasReviewed);
                m.put("hired",           candidate.getHiredAt() != null);
                m.put("hiredCompanyName", candidate.getHiredCompanyName());
                return m;
            }).toList();
        } else {
            // EMPLOYER: return all slots across their interview windows
            var employer = employerRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Employer profile not found."));
            result = slotRepository.findByWindow_Employer(employer).stream().map(s -> {
                var cUser = s.getCandidate().getUser();
                boolean hasReviewed = reviewRepository.findByRaterIdAndInterviewSlotId(user.getId(), s.getId()).isPresent();
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("slotId",          s.getId());
                m.put("jobTitle",        s.getJobPosting().getJobTitle());
                m.put("candidate",       cUser.getName());
                m.put("candidateEmail",  cUser.getEmail());
                m.put("candidatePhone",  cUser.getPhoneNo());
                m.put("skills",          s.getCandidate().getParsedSkills());
                m.put("startTime",       s.getStartTime().toString());
                m.put("endTime",         s.getEndTime().toString());
                m.put("status",          s.getStatus().name());
                m.put("calendlyLink",    s.getCalendlyLink());
                m.put("hasReviewed",     hasReviewed);
                m.put("candidateId",     s.getCandidate().getId());
                m.put("jobPostingId",    s.getJobPosting().getId());
                m.put("candidateHired",  s.getCandidate().getHiredAt() != null);
                return m;
            }).toList();
        }

        return ResponseEntity.ok(ApiResponse.ok("Interviews fetched.", result));
    }

    // Returns summary of a single slot (used by rating pages for context)
    @GetMapping("/slots/{slotId}")
    public ResponseEntity<ApiResponse<Object>> getSlot(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long slotId) {

        InterviewSlot s = slotRepository.findById(slotId)
                .orElseThrow(() -> new IllegalArgumentException("Slot not found."));

        var emp  = s.getJobPosting().getEmployer();
        var cUser = s.getCandidate().getUser();

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("slotId",          s.getId());
        m.put("jobTitle",        s.getJobPosting().getJobTitle());
        m.put("status",          s.getStatus().name());
        m.put("candidate",       cUser.getName());
        m.put("candidateEmail",  cUser.getEmail());
        m.put("employer",        emp.getCompanyName());
        m.put("employerEmail",   emp.getUser().getEmail());
        m.put("companyLocation", emp.getCompanyLocation());

        return ResponseEntity.ok(ApiResponse.ok("Slot fetched.", m));
    }

    // Update slot status — drives the PENDING→CONFIRMED→COMPLETED flow
    @PatchMapping("/slots/{slotId}/status")
    public ResponseEntity<ApiResponse<Object>> updateSlotStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long slotId,
            @RequestBody Map<String, String> body) {

        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        InterviewSlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new IllegalArgumentException("Slot not found."));

        String requested = body.get("status");
        if (requested == null) throw new IllegalArgumentException("Status is required.");
        InterviewSlot.SlotStatus newStatus = InterviewSlot.SlotStatus.valueOf(requested);
        InterviewSlot.SlotStatus current   = slot.getStatus();

        if (user.getRole() == Role.CANDIDATE) {
            var candidate = candidateRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Candidate not found."));
            if (!slot.getCandidate().getId().equals(candidate.getId())) {
                throw new IllegalArgumentException("You are not the candidate for this slot.");
            }
            // Candidate: PENDING→CONFIRMED or PENDING/CONFIRMED→CANCELLED
            boolean allowed = (newStatus == InterviewSlot.SlotStatus.CONFIRMED && current == InterviewSlot.SlotStatus.PENDING)
                           || (newStatus == InterviewSlot.SlotStatus.CANCELLED  && (current == InterviewSlot.SlotStatus.PENDING || current == InterviewSlot.SlotStatus.CONFIRMED));
            if (!allowed) throw new IllegalArgumentException("Invalid status transition for candidate.");

        } else if (user.getRole() == Role.EMPLOYER) {
            var employer = employerRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Employer not found."));
            if (!slot.getWindow().getEmployer().getId().equals(employer.getId())) {
                throw new IllegalArgumentException("You are not the employer for this slot.");
            }
            // Employer: CONFIRMED→COMPLETED or PENDING/CONFIRMED→CANCELLED
            if (newStatus == InterviewSlot.SlotStatus.COMPLETED && LocalDateTime.now().isBefore(slot.getStartTime())) {
                throw new IllegalArgumentException("Cannot mark as complete before the interview begins.");
            }
            boolean allowed = (newStatus == InterviewSlot.SlotStatus.COMPLETED  && current == InterviewSlot.SlotStatus.CONFIRMED)
                           || (newStatus == InterviewSlot.SlotStatus.CANCELLED   && (current == InterviewSlot.SlotStatus.PENDING || current == InterviewSlot.SlotStatus.CONFIRMED));
            if (!allowed) throw new IllegalArgumentException("Invalid status transition for employer.");

        } else {
            throw new IllegalArgumentException("Admins cannot update slot status.");
        }

        slot.setStatus(newStatus);
        slotRepository.save(slot);
        return ResponseEntity.ok(ApiResponse.ok("Slot status updated to " + newStatus + ".", null));
    }
}
