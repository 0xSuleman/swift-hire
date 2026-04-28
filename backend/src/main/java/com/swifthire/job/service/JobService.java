package com.swifthire.job.service;

import com.swifthire.common.exception.ResourceNotFoundException;
import com.swifthire.job.model.JobPosting;
import com.swifthire.job.model.MatchScore;
import com.swifthire.job.repository.JobPostingRepository;
import com.swifthire.job.repository.MatchScoreRepository;
import com.swifthire.user.model.Candidate;
import com.swifthire.user.repository.CandidateRepository;
import com.swifthire.user.repository.EmployerRepository;
import com.swifthire.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class JobService {

    private final UserRepository userRepository;
    private final EmployerRepository employerRepository;
    private final JobPostingRepository jobPostingRepository;
    private final MatchScoreRepository matchScoreRepository;
    private final CandidateRepository candidateRepository;
    private final PromptEngineService promptEngineService;
    private final AtsScoreService atsScoreService;

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

        // Run ATS scoring immediately
        List<MatchScore> scores = atsScoreService.scoreAndRank(job);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("jobPostingId", job.getId());
        result.put("jobTitle", job.getJobTitle());
        result.put("candidatesFound", scores.size());
        return result;
    }

    @Transactional
    public List<Map<String, Object>> getRankedCandidates(String email, Long jobId) {
        // Increment profile view counter for each candidate returned
        List<MatchScore> scores = matchScoreRepository.findByJobPostingIdOrderByRankingAsc(jobId);
        return scores.stream().limit(10).map(ms -> {
            Candidate c = ms.getCandidate();
            c.setProfileViews(c.getProfileViews() + 1);
            candidateRepository.save(c);

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("candidateId",   c.getId());
            m.put("name",          c.getUser().getName());
            m.put("skills",        c.getParsedSkills());
            m.put("matchScore",    ms.getMatchPercentage());
            m.put("ranking",       ms.getRanking());
            m.put("averageRating", c.getUser().getAverageRating());
            return m;
        }).toList();
    }

    public List<Map<String, Object>> getJobPostingsForEmployer(String email) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        var employer = employerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Employer not found."));

        return jobPostingRepository.findByEmployer(employer).stream().map(job -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", job.getId());
            m.put("title", job.getJobTitle());
            m.put("status", job.getStatus());
            m.put("createdAt", job.getCreatedAt());
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
}
