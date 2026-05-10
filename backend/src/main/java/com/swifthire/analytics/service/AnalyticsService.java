package com.swifthire.analytics.service;

import com.swifthire.common.exception.ResourceNotFoundException;
import com.swifthire.job.model.JobPosting;
import com.swifthire.job.repository.JobPostingRepository;
import com.swifthire.job.repository.MatchScoreRepository;
import com.swifthire.review.repository.ReviewRepository;
import com.swifthire.scheduling.model.InterviewSlot;
import com.swifthire.scheduling.repository.InterviewSlotRepository;
import com.swifthire.user.model.User;
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
    private final ReviewRepository reviewRepository;

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
                .stream().limit(10).forEach(ms -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("jobTitle",  ms.getJobPosting().getJobTitle());
                    m.put("atsScore",  ms.getMatchPercentage());
                    topMatches.add(m);
                });

        int skillsCount = (candidate.getParsedSkills() != null && !candidate.getParsedSkills().isBlank())
                ? (int) java.util.Arrays.stream(candidate.getParsedSkills().split(","))
                        .filter(s -> !s.isBlank()).count()
                : 0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("profileViews",        candidate.getProfileViews());
        result.put("interviewCount",      slots.size());
        result.put("averageRating",       user.getAverageRating());
        result.put("parsedSkillsCount",   skillsCount);
        result.put("interviewStatusBreakdown", statusBreakdown);
        result.put("topJobMatches",       topMatches);
        result.put("ratingsBreakdown",    buildRatingsBreakdown(user));
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
        double timeToHireSum = 0;
        long timeToHireCount = 0;
        double atsSum = 0;
        long atsCount = 0;

        List<Map<String, Object>> perJob = new ArrayList<>();

        // Batch load all slots for this employer's jobs in a single query (avoids N+1)
        List<Long> jobIds = jobs.stream().map(com.swifthire.job.model.JobPosting::getId).toList();
        Map<Long, List<InterviewSlot>> slotsByJob = jobIds.isEmpty() ? Map.of()
                : slotRepository.findByJobPostingIdIn(jobIds).stream()
                        .collect(java.util.stream.Collectors.groupingBy(
                                s -> s.getJobPosting().getId()));

        for (var job : jobs) {
            List<InterviewSlot> slots = slotsByJob.getOrDefault(job.getId(), List.of());
            long jobTotal     = slots.size();
            long jobAccepted  = slots.stream().filter(s ->
                    s.getStatus() == InterviewSlot.SlotStatus.CONFIRMED ||
                    s.getStatus() == InterviewSlot.SlotStatus.COMPLETED).count();

            totalSlots    += jobTotal;
            acceptedSlots += jobAccepted;

            var jobScores = matchScoreRepository.findByJobPostingIdOrderByRankingAsc(job.getId());
            double averageAts = jobScores.stream()
                    .mapToDouble(com.swifthire.job.model.MatchScore::getMatchPercentage)
                    .average()
                    .orElse(0.0);
            atsSum += jobScores.stream().mapToDouble(com.swifthire.job.model.MatchScore::getMatchPercentage).sum();
            atsCount += jobScores.size();

            // Time-to-hire: fractional days from job creation to earliest confirmed/completed slot
            var earliest = slots.stream()
                    .filter(s -> s.getStatus() == InterviewSlot.SlotStatus.CONFIRMED ||
                                 s.getStatus() == InterviewSlot.SlotStatus.COMPLETED)
                    .map(InterviewSlot::getStartTime)
                    .min(java.time.LocalDateTime::compareTo);
            double jobTimeToHire = 0;
            if (earliest.isPresent()) {
                jobTimeToHire = Math.max(0, Duration.between(job.getCreatedAt(), earliest.get()).toMinutes() / 1440.0);
                jobTimeToHire = Math.round(jobTimeToHire * 10) / 10.0;
                timeToHireSum += jobTimeToHire;
                timeToHireCount++;
            }

            Map<String, Object> jobMap = new LinkedHashMap<>();
            jobMap.put("jobId",          job.getId());
            jobMap.put("jobTitle",       job.getJobTitle());
            jobMap.put("status",         job.getStatus().name());
            jobMap.put("totalSlots",     jobTotal);
            jobMap.put("acceptedSlots",  jobAccepted);
            jobMap.put("timeToHireDays", jobTimeToHire);
            jobMap.put("averageAtsScore", Math.round(averageAts * 10.0) / 10.0);
            jobMap.put("belowAtsThreshold", jobScores.stream().filter(ms -> ms.getMatchPercentage() < 50.0).count());
            perJob.add(jobMap);
        }

        double acceptanceRate = totalSlots > 0
                ? Math.round((double) acceptedSlots / totalSlots * 100.0 * 10) / 10.0
                : 0.0;
        double avgTimeToHire = timeToHireCount > 0
                ? Math.round((double) timeToHireSum / timeToHireCount * 10) / 10.0
                : 0.0;
        double avgAtsScore = atsCount > 0
                ? Math.round(atsSum / atsCount * 10) / 10.0
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
        result.put("averageAtsScore",   avgAtsScore);
        result.put("jobBreakdown",      perJob);
        result.put("jobStatusCounts",   jobStatusCounts);
        result.put("ratingsBreakdown",  buildRatingsBreakdown(user));
        return result;
    }

    // Ratings distribution: count of 1★ through 5★ received by user
    private Map<String, Object> buildRatingsBreakdown(User user) {
        var reviews = reviewRepository.findByRatee(user);
        Map<String, Object> breakdown = new LinkedHashMap<>();
        for (int star = 1; star <= 5; star++) {
            final int s = star;
            breakdown.put(s + "★", reviews.stream().filter(r -> r.getRatingValue() == s).count());
        }
        return breakdown;
    }
}
