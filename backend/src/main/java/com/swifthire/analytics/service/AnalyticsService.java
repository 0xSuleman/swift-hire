package com.swifthire.analytics.service;

import com.swifthire.common.exception.ResourceNotFoundException;
import com.swifthire.scheduling.repository.InterviewSlotRepository;
import com.swifthire.user.repository.CandidateRepository;
import com.swifthire.user.repository.EmployerRepository;
import com.swifthire.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserRepository userRepository;
    private final CandidateRepository candidateRepository;
    private final EmployerRepository employerRepository;
    private final InterviewSlotRepository slotRepository;

    // UC-16: Candidate view — profile views, application count, interview count
    public Map<String, Object> getCandidateAnalytics(String email) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        var candidate = candidateRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found."));

        long interviewCount = slotRepository.findByCandidate(candidate).size();

        return Map.of(
                "profileViews", candidate.getProfileViews(),
                "interviewCount", interviewCount,
                "averageRating", user.getAverageRating(),
                "parsedSkillsCount", candidate.getParsedSkills() != null
                        ? candidate.getParsedSkills().split(",").length : 0
        );
    }

    // UC-16: Employer view — per-job stats
    public Map<String, Object> getEmployerAnalytics(String email) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        // TODO: aggregate time-to-hire, acceptance rate, interview count per posting
        return Map.of(
                "averageRating", user.getAverageRating(),
                "totalRatings", user.getTotalRatings()
        );
    }
}
