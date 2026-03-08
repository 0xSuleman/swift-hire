package com.swifthire.scheduling.controller;

import com.swifthire.common.dto.ApiResponse;
import com.swifthire.scheduling.model.InterviewSlot;
import com.swifthire.scheduling.model.InterviewWindow;
import com.swifthire.scheduling.service.ScheduleService;
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

    // UC-04: Auto-Schedule Batch
    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<Object>> scheduleBatch(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) {

        Long jobPostingId = Long.valueOf(body.get("jobPostingId").toString());

        @SuppressWarnings("unchecked")
        List<Long> candidateIds = ((List<Object>) body.get("candidateIds"))
                .stream().map(o -> Long.valueOf(o.toString())).toList();

        InterviewWindow window = new InterviewWindow();
        window.setDate(LocalDate.parse(body.get("date").toString()));
        window.setStartTime(LocalTime.parse(body.get("startTime").toString()));
        window.setEndTime(LocalTime.parse(body.get("endTime").toString()));

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
