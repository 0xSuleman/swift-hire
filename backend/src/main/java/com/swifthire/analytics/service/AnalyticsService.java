package com.swifthire.analytics.service;

import com.swifthire.common.exception.ResourceNotFoundException;
import com.swifthire.job.model.JobPosting;
import com.swifthire.job.repository.JobPostingRepository;
import com.swifthire.job.repository.MatchScoreRepository;
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
    private final MatchScoreRepository matchScoreRepository;

    // UC-16: Candidate view — profile views, interview count, rating, skill count + chart data
    public Map<String, Object> getCandidateAnalytics(String email) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        var candidate = candidateRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found."));

        List<InterviewSlot> slots = slotRepository.findByCandidate(candidate);

        // Interview status breakdown
        long pending   = slots.stream().filter(s -> s.getStatus() == InterviewSlot.SlotStatus.PENDING).count();
        long confirmed = slots.stream().filter(s -> s.getStatus() == InterviewSlot.SlotStatus.CONFIRMED).count();
        long completed = slots.stream().filter(s -> s.getStatus() == InterviewSlot.SlotStatus.COMPLETED).count();
        long cancelled = slots.stream().filter(s -> s.getStatus() == InterviewSlot.SlotStatus.CANCELLED).count();

        Map<String, Object> statusBreakdown = new LinkedHashMap<>();
        statusBreakdown.put("PENDING",   pending);
        statusBreakdown.put("CONFIRMED", confirmed);
        statusBreakdown.put("COMPLETED", completed);
        statusBreakdown.put("CANCELLED", cancelled);

        // Top job matches by ATS score
        List<Map<String, Object>> topMatches = new ArrayList<>();
        matchScoreRepository.findByCandidateOrderByMatchPercentageDesc(candidate)
                .stream().limit(6).forEach(ms -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("jobTitle",  ms.getJobPosting().getJobTitle());
                    m.put("atsScore",  ms.getMatchPercentage());
                    topMatches.add(m);
                });

        int skillsCount = candidate.getParsedSkills() != null
                ? candidate.getParsedSkills().split(",").length : 0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("profileViews",        candidate.getProfileViews());
        result.put("interviewCount",      slots.size());
        result.put("averageRating",       user.getAverageRating());
        result.put("parsedSkillsCount",   skillsCount);
        result.put("interviewStatusBreakdown", statusBreakdown);
        result.put("topJobMatches",       topMatches);
        return result;
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

            long jobTimeToHire = 0;
            if (earliest.isPresent()) {
                jobTimeToHire = Duration.between(job.getCreatedAt(), earliest.get()).toDays();
            }

            Map<String, Object> jobMap = new LinkedHashMap<>();
            jobMap.put("jobId",          job.getId());
            jobMap.put("jobTitle",       job.getJobTitle());
            jobMap.put("status",         job.getStatus().name());
            jobMap.put("totalSlots",     jobTotal);
            jobMap.put("acceptedSlots",  jobAccepted);
            jobMap.put("timeToHireDays", jobTimeToHire);
            perJob.add(jobMap);
        }

        double acceptanceRate = totalSlots > 0
                ? Math.round((double) acceptedSlots / totalSlots * 100.0 * 10) / 10.0
                : 0.0;
        double avgTimeToHire = timeToHireCount > 0
                ? Math.round((double) timeToHireSum / timeToHireCount * 10) / 10.0
                : 0.0;

        // Job status counts
        long openJobs     = jobs.stream().filter(j -> j.getStatus() == JobPosting.JobStatus.OPEN).count();
        long closedJobs   = jobs.stream().filter(j -> j.getStatus() == JobPosting.JobStatus.CLOSED).count();
        long archivedJobs = jobs.stream().filter(j -> j.getStatus() == JobPosting.JobStatus.ARCHIVED).count();

        Map<String, Object> jobStatusCounts = new LinkedHashMap<>();
        jobStatusCounts.put("OPEN",     openJobs);
        jobStatusCounts.put("CLOSED",   closedJobs);
        jobStatusCounts.put("ARCHIVED", archivedJobs);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("averageRating",     user.getAverageRating());
        result.put("totalRatings",      user.getTotalRatings());
        result.put("totalInterviews",   totalSlots);
        result.put("acceptanceRate",    acceptanceRate);
        result.put("avgTimeToHireDays", avgTimeToHire);
        result.put("jobBreakdown",      perJob);
        result.put("jobStatusCounts",   jobStatusCounts);
        return result;
    }
}
