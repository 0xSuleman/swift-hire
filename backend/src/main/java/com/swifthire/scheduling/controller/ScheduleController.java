package com.swifthire.scheduling.controller;

import com.swifthire.common.dto.ApiResponse;
import com.swifthire.scheduling.model.InterviewSlot;
import com.swifthire.scheduling.model.InterviewWindow;
import com.swifthire.scheduling.repository.InterviewWindowRepository;
import com.swifthire.scheduling.service.ScheduleService;
import com.swifthire.user.model.Employer;
import com.swifthire.user.repository.EmployerRepository;
import com.swifthire.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/schedule")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;
    private final InterviewWindowRepository windowRepository;
    private final EmployerRepository employerRepository;
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

    // Get interviews for current candidate
    @GetMapping("/my-interviews")
    public ResponseEntity<ApiResponse<Object>> getMyInterviews(
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: return slots for the logged-in candidate/employer
        return ResponseEntity.ok(ApiResponse.ok("TODO", null));
    }
}
