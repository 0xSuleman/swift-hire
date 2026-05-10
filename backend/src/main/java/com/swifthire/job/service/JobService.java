package com.swifthire.job.service;

import com.swifthire.application.model.Application;
import com.swifthire.application.model.ApplicationStatus;
import com.swifthire.application.service.ApplicationService;
import com.swifthire.common.exception.ResourceNotFoundException;
import com.swifthire.job.model.HiringPrompt;
import com.swifthire.job.model.JobPosting;
import com.swifthire.job.model.MatchScore;
import com.swifthire.job.repository.HiringPromptRepository;
import com.swifthire.job.repository.JobPostingRepository;
import com.swifthire.job.repository.MatchScoreRepository;
import com.swifthire.scheduling.model.InterviewSlot;
import com.swifthire.scheduling.repository.InterviewSlotRepository;
import com.swifthire.user.model.Candidate;
import com.swifthire.user.model.Employer;
import com.swifthire.user.repository.CandidateRepository;
import com.swifthire.user.repository.EmployerRepository;
import com.swifthire.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class JobService {

    private final UserRepository userRepository;
    private final EmployerRepository employerRepository;
    private final JobPostingRepository jobPostingRepository;
    private final HiringPromptRepository hiringPromptRepository;
    private final MatchScoreRepository matchScoreRepository;
    private final CandidateRepository candidateRepository;
    private final PromptEngineService promptEngineService;
    private final AtsScoreService atsScoreService;
    private final InterviewSlotRepository slotRepository;
    private final ApplicationService applicationService;

    @Transactional
    public Map<String, Object> processHiringPrompt(String email, String rawPrompt) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        var employer = employerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Employer profile not found."));

        // UC-02: Parse prompt → create JobPosting
        PromptEngineService.ParsedPrompt parsed = promptEngineService.parse(rawPrompt);

        JobPosting job = JobPosting.builder()
                .employer(employer)
                .jobTitle(parsed.jobTitle())
                .requiredSkills(parsed.requiredSkillsTag())
                .location(parsed.location())
                .shift(parsed.shift())
                .experienceYears(parsed.experienceYears())
                .build();
        jobPostingRepository.save(job);

        HiringPrompt hiringPrompt = HiringPrompt.builder()
                .employer(employer)
                .jobPosting(job)
                .rawText(rawPrompt)
                .parsedSkills(String.join(",", parsed.skills()).toLowerCase())
                .parsedLocation(parsed.location())
                .parsedShift(parsed.shift())
                .parsedExperienceYears(parsed.experienceYears())
                .build();
        hiringPromptRepository.save(hiringPrompt);

        // Run ATS scoring immediately
        List<MatchScore> scores = atsScoreService.scoreAndRank(job);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("jobPostingId",      job.getId());
        result.put("jobTitle",          job.getJobTitle());
        result.put("candidatesFound",   scores.size());
        result.put("parsedSkills",      parsed.skills());
        result.put("parsedLocation",    parsed.location());
        result.put("parsedShift",       parsed.shift());
        result.put("parsedExperience",  parsed.experienceYears());
        return result;
    }

    @Transactional
    public List<Map<String, Object>> getRankedCandidates(String email, Long jobId,
                                                         String skill,
                                                         Double minAtsScore,
                                                         Double minRating,
                                                         String location,
                                                         String shift,
                                                         String applicationStatus) {
        JobPosting job = findEmployerJob(email, jobId);

        // Increment profile view counter for each candidate returned
        List<MatchScore> scores = matchScoreRepository.findByJobPostingIdOrderByRankingAsc(jobId);
        applicationService.ensureRecommendedForScores(scores, email, "LEGACY_BACKFILL");
        Map<Long, Application> applications = applicationService.findByJobPostingIdMappedByCandidateId(jobId);
        ApplicationStatus statusFilter = parseStatus(applicationStatus);

        return scores.stream()
                .filter(ms -> ms.getJobPosting().getId().equals(job.getId()))
                .filter(ms -> minAtsScore == null || ms.getMatchPercentage() >= minAtsScore - 0.05)
                .filter(ms -> minRating == null || ms.getCandidate().getUser().getAverageRating() >= minRating)
                .filter(ms -> textContains(ms.getCandidate().getParsedSkills(), skill))
                .filter(ms -> textContains(ms.getCandidate().getPreferredLocation(), location))
                .filter(ms -> textEquals(ms.getCandidate().getPreferredShift(), shift))
                .filter(ms -> {
                    if (statusFilter == null) return true;
                    Application app = applications.get(ms.getCandidate().getId());
                    return app != null && app.getStatus() == statusFilter;
                })
                .map(ms -> {
            Candidate c = ms.getCandidate();
            c.setProfileViews(c.getProfileViews() + 1);
            candidateRepository.save(c);
            Application application = applications.get(c.getId());

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("candidateId",   c.getId());
            m.put("name",          c.getUser().getName());
            m.put("skills",        c.getParsedSkills());
            m.put("location",      c.getPreferredLocation());
            m.put("shift",         c.getPreferredShift());
            m.put("matchScore",    ms.getMatchPercentage());
            m.put("ranking",       ms.getRanking());
            m.put("averageRating",   c.getUser().getAverageRating());
            m.put("skillMatchPct",   ms.getSkillMatchPct());
            m.put("locationMatched", ms.isLocationMatched());
            m.put("shiftMatched",    ms.isShiftMatched());
            m.put("status",          application != null ? application.getStatus().name() : ApplicationStatus.RECOMMENDED.name());
            return m;
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getJobPostingsForEmployer(String email) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        var employer = employerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Employer not found."));

        return jobPostingRepository.findByEmployer(employer).stream().map(job -> {
            Optional<HiringPrompt> prompt = hiringPromptRepository.findByJobPosting(job);
            List<MatchScore> scores = matchScoreRepository.findByJobPostingIdOrderByRankingAsc(job.getId());
            double averageAts = scores.stream().mapToDouble(MatchScore::getMatchPercentage).average().orElse(0.0);
            long belowThreshold = scores.stream().filter(ms -> ms.getMatchPercentage() < 50.0).count();

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", job.getId());
            m.put("title", job.getJobTitle());
            m.put("status", job.getStatus());
            m.put("createdAt", job.getCreatedAt());
            m.put("requiredSkills", job.getRequiredSkills());
            m.put("location", job.getLocation());
            m.put("shift", job.getShift());
            m.put("experienceYears", job.getExperienceYears());
            m.put("candidateCount", scores.size());
            m.put("averageAtsScore", Math.round(averageAts * 10.0) / 10.0);
            m.put("belowThresholdCount", belowThreshold);
            prompt.ifPresent(hp -> {
                m.put("rawPrompt", hp.getRawText());
                m.put("promptSubmittedAt", hp.getSubmissionDate());
                m.put("parsedSkills", hp.getParsedSkills());
                m.put("parsedLocation", hp.getParsedLocation());
                m.put("parsedShift", hp.getParsedShift());
                m.put("parsedExperienceYears", hp.getParsedExperienceYears());
            });
            return m;
        }).toList();
    }

    @Transactional
    public void updateJobPosting(String email, Long jobId, Map<String, String> updates) {
        JobPosting job = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job posting not found."));
        if (updates.containsKey("jobTitle"))      job.setJobTitle(updates.get("jobTitle"));
        if (updates.containsKey("location"))      job.setLocation(updates.get("location"));
        if (updates.containsKey("shift"))         job.setShift(updates.get("shift"));
        jobPostingRepository.save(job);
    }

    @Transactional
    public void archiveJobPosting(String email, Long jobId) {
        JobPosting job = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job posting not found."));
        job.setStatus(JobPosting.JobStatus.ARCHIVED);
        jobPostingRepository.save(job);
    }

    @Transactional
    public void closeJobPosting(String email, Long jobId) {
        JobPosting job = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job posting not found."));
        if (job.getStatus() != JobPosting.JobStatus.OPEN) {
            throw new IllegalArgumentException("Only OPEN jobs can be closed.");
        }
        job.setStatus(JobPosting.JobStatus.CLOSED);
        jobPostingRepository.save(job);
    }

    // UC-03 extended: Returns all matched candidates for a job with derived application status
    @Transactional
    public List<Map<String, Object>> getCandidateApplicationStatuses(String email, Long jobId) {
        findEmployerJob(email, jobId);

        List<MatchScore> scores = matchScoreRepository.findByJobPostingIdOrderByRankingAsc(jobId);
        applicationService.ensureRecommendedForScores(scores, email, "LEGACY_BACKFILL");
        Map<Long, Application> applications = applicationService.findByJobPostingIdMappedByCandidateId(jobId);
        List<InterviewSlot> jobSlots = slotRepository.findByJobPostingId(jobId);

        return scores.stream().map(ms -> {
            Candidate c = ms.getCandidate();
            InterviewSlot slot = jobSlots.stream()
                    .filter(s -> s.getCandidate().getId().equals(c.getId()))
                    .max((a, b) -> a.getStartTime().compareTo(b.getStartTime()))
                    .orElse(null);
            Application application = applications.get(c.getId());

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("candidateId",  c.getId());
            m.put("name",         c.getUser().getName());
            m.put("matchScore",   ms.getMatchPercentage());
            m.put("ranking",      ms.getRanking());
            m.put("status",       application != null ? application.getStatus().name() : ApplicationStatus.RECOMMENDED.name());
            m.put("interviewDate", slot != null ? slot.getStartTime().toString() : null);
            return m;
        }).toList();
    }

    @Transactional
    public Map<String, Object> updateApplicationStatus(String email, Long jobId, Long candidateId, String requestedStatus) {
        JobPosting job = findEmployerJob(email, jobId);
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found."));
        ApplicationStatus newStatus = parseStatus(requestedStatus);
        if (newStatus != ApplicationStatus.SHORTLISTED && newStatus != ApplicationStatus.REJECTED) {
            throw new IllegalArgumentException("Only SHORTLISTED or REJECTED can be set from this action.");
        }

        Application application = applicationService.changeStatus(candidate, job, newStatus, email, "EMPLOYER_ACTION");
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("candidateId", candidate.getId());
        result.put("jobId", job.getId());
        result.put("status", application.getStatus().name());
        return result;
    }

    private JobPosting findEmployerJob(String email, Long jobId) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        Employer employer = employerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Employer not found."));
        JobPosting job = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found."));
        if (!job.getEmployer().getId().equals(employer.getId())) {
            throw new IllegalArgumentException("Access denied.");
        }
        return job;
    }

    private ApplicationStatus parseStatus(String status) {
        if (status == null || status.isBlank()) return null;
        try {
            return ApplicationStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid application status.");
        }
    }

    private boolean textContains(String value, String filter) {
        if (filter == null || filter.isBlank()) return true;
        return value != null && value.toLowerCase().contains(filter.trim().toLowerCase());
    }

    private boolean textEquals(String value, String filter) {
        if (filter == null || filter.isBlank()) return true;
        return value != null && value.equalsIgnoreCase(filter.trim());
    }
}
