package com.swifthire.scheduling.controller;

import com.swifthire.common.dto.ApiResponse;
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

    // UC-04: Auto-Schedule Batch
    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<Object>> scheduleBatch(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) {

        Long jobPostingId = Long.valueOf(body.get("jobPostingId").toString());

        @SuppressWarnings("unchecked")
        List<Long> candidateIds = ((List<Object>) body.get("candidateIds"))
                .stream().map(o -> Long.valueOf(o.toString())).toList();

        // Lookup employer for the window
        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        Employer employer = employerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Employer not found."));

        // Persist the window first — fixes TransientPropertyValueException (Bug #2)
        InterviewWindow window = InterviewWindow.builder()
                .employer(employer)
                .date(LocalDate.parse(body.get("date").toString()))
                .startTime(LocalTime.parse(body.get("startTime").toString()))
                .endTime(LocalTime.parse(body.get("endTime").toString()))
                .build();
        windowRepository.save(window);

        List<InterviewSlot> slots = scheduleService.scheduleBatch(jobPostingId, candidateIds, window);

        return ResponseEntity.ok(ApiResponse.ok(
                "Schedule created. Invitations sent to " + slots.size() + " candidate(s).", slots.size()));
    }

    // UC-04 / UC-11: Return scheduled slots for the logged-in candidate or employer
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
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("slotId",       s.getId());
                m.put("jobTitle",     s.getJobPosting().getJobTitle());
                m.put("employer",     s.getJobPosting().getEmployer().getCompanyName());
                m.put("startTime",    s.getStartTime().toString());
                m.put("endTime",      s.getEndTime().toString());
                m.put("status",       s.getStatus().name());
                m.put("calendlyLink", s.getCalendlyLink());
                return m;
            }).toList();
        } else {
            // EMPLOYER: return all slots across their interview windows
            var employer = employerRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Employer profile not found."));
            result = slotRepository.findByWindow_Employer(employer).stream().map(s -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("slotId",       s.getId());
                m.put("jobTitle",     s.getJobPosting().getJobTitle());
                m.put("candidate",    s.getCandidate().getUser().getName());
                m.put("skills",       s.getCandidate().getParsedSkills());
                m.put("startTime",    s.getStartTime().toString());
                m.put("endTime",      s.getEndTime().toString());
                m.put("status",       s.getStatus().name());
                m.put("calendlyLink", s.getCalendlyLink());
                return m;
            }).toList();
        }

        return ResponseEntity.ok(ApiResponse.ok("Interviews fetched.", result));
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
