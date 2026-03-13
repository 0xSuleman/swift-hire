package com.swifthire.analytics.service;

import com.swifthire.common.exception.ResourceNotFoundException;
import com.swifthire.job.repository.JobPostingRepository;
import com.swifthire.scheduling.model.InterviewSlot;
import com.swifthire.scheduling.repository.InterviewSlotRepository;
import com.swifthire.user.repository.CandidateRepository;
import com.swifthire.user.repository.EmployerRepository;
import com.swifthire.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserRepository userRepository;
    private final CandidateRepository candidateRepository;
    private final EmployerRepository employerRepository;
    private final InterviewSlotRepository slotRepository;
    private final JobPostingRepository jobPostingRepository;

    // UC-16: Candidate view — profile views, interview count, rating, skill count
    public Map<String, Object> getCandidateAnalytics(String email) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        var candidate = candidateRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found."));

        long interviewCount = slotRepository.findByCandidate(candidate).size();

        return Map.of(
                "profileViews",      candidate.getProfileViews(),
                "interviewCount",    interviewCount,
                "averageRating",     user.getAverageRating(),
                "parsedSkillsCount", candidate.getParsedSkills() != null
                        ? candidate.getParsedSkills().split(",").length : 0
        );
    }

    // UC-16: Employer view — time-to-hire, acceptance rate, per-job breakdown
    public Map<String, Object> getEmployerAnalytics(String email) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        var employer = employerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Employer profile not found."));

        var jobs = jobPostingRepository.findByEmployer(employer);

        long totalSlots = 0;
        long acceptedSlots = 0;   // CONFIRMED + COMPLETED
        long timeToHireSum = 0;
        long timeToHireCount = 0;

        List<Map<String, Object>> perJob = new ArrayList<>();

        for (var job : jobs) {
            List<InterviewSlot> slots = slotRepository.findByJobPostingId(job.getId());
            long jobTotal     = slots.size();
            long jobAccepted  = slots.stream().filter(s ->
                    s.getStatus() == InterviewSlot.SlotStatus.CONFIRMED ||
                    s.getStatus() == InterviewSlot.SlotStatus.COMPLETED).count();

            totalSlots    += jobTotal;
            acceptedSlots += jobAccepted;

            // Time-to-hire: days from job creation to earliest confirmed/completed slot
            var earliest = slots.stream()
                    .filter(s -> s.getStatus() == InterviewSlot.SlotStatus.CONFIRMED ||
                                 s.getStatus() == InterviewSlot.SlotStatus.COMPLETED)
                    .map(InterviewSlot::getStartTime)
                    .min(java.time.LocalDateTime::compareTo);
            if (earliest.isPresent()) {
                timeToHireSum   += Duration.between(job.getCreatedAt(), earliest.get()).toDays();
                timeToHireCount++;
            }

            Map<String, Object> jobMap = new LinkedHashMap<>();
            jobMap.put("jobId",          job.getId());
            jobMap.put("jobTitle",       job.getJobTitle());
            jobMap.put("status",         job.getStatus().name());
            jobMap.put("totalSlots",     jobTotal);
            jobMap.put("acceptedSlots",  jobAccepted);
            perJob.add(jobMap);
        }

        double acceptanceRate = totalSlots > 0
                ? Math.round((double) acceptedSlots / totalSlots * 100.0 * 10) / 10.0
                : 0.0;
        double avgTimeToHire = timeToHireCount > 0
                ? Math.round((double) timeToHireSum / timeToHireCount * 10) / 10.0
                : 0.0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("averageRating",   user.getAverageRating());
        result.put("totalRatings",    user.getTotalRatings());
        result.put("totalInterviews", totalSlots);
        result.put("acceptanceRate",  acceptanceRate);   // %
        result.put("avgTimeToHireDays", avgTimeToHire);
        result.put("jobBreakdown",    perJob);
        return result;
    }
}
