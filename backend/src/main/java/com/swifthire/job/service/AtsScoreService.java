package com.swifthire.job.service;

import com.swifthire.application.service.ApplicationService;
import com.swifthire.job.model.JobPosting;
import com.swifthire.job.model.MatchScore;
import com.swifthire.job.repository.MatchScoreRepository;
import com.swifthire.user.model.Candidate;
import com.swifthire.user.repository.CandidateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * BE3 — ATS Scoring Algorithm (UC-02, UC-03)
 * Scores all candidates against a job posting and persists ranked results.
 * Target: ≥85% precision/recall (NFR 3.5.1), ≤4s for pool of 10,000 (NFR 3.1.4)
 */
@Service
@RequiredArgsConstructor
public class AtsScoreService {

    private final CandidateRepository candidateRepository;
    private final MatchScoreRepository matchScoreRepository;
    private final ApplicationService applicationService;

    @Transactional
    public List<MatchScore> scoreAndRank(JobPosting jobPosting) {
        Set<String> requiredTags = parseTags(jobPosting.getRequiredSkills());

        List<Candidate> allCandidates = candidateRepository.findAll();

        // Score each candidate — exclude hired candidates from the active pool.
        // Skills are the primary gate; location and shift affect bonus only (not hard filters).
        List<MatchScore> scores = allCandidates.stream()
                .filter(c -> c.getHiredAt() == null)
                .filter(c -> c.getParsedSkills() != null && !c.getParsedSkills().isBlank())
                .map(candidate -> {
                    Set<String> candidateTags = parseTags(candidate.getParsedSkills());
                    double skillPct = calculateMatch(candidateTags, requiredTags);
                    double bonus    = preferenceBonus(candidate, jobPosting);
                    double overall  = Math.min(skillPct + bonus, 100.0);

                    boolean locMatched = jobPosting.getLocation() == null ||
                            (candidate.getPreferredLocation() != null &&
                             candidate.getPreferredLocation().equalsIgnoreCase(jobPosting.getLocation()));
                    boolean shiftMatched = jobPosting.getShift() == null ||
                            (candidate.getPreferredShift() != null &&
                             candidate.getPreferredShift().equalsIgnoreCase(jobPosting.getShift()));

                    return MatchScore.builder()
                            .candidate(candidate)
                            .jobPosting(jobPosting)
                            .matchPercentage(overall)
                            .skillMatchPct(skillPct)
                            .locationMatched(locMatched)
                            .shiftMatched(shiftMatched)
                            .build();
                })
                .filter(ms -> ms.getMatchPercentage() > 0)
                .filter(ms -> requiredTags.isEmpty() || ms.getSkillMatchPct() > 0)
                .sorted(Comparator.comparingDouble(MatchScore::getMatchPercentage).reversed())
                .collect(Collectors.toList());

        // Assign rankings
        for (int i = 0; i < scores.size(); i++) {
            scores.get(i).setRanking(i + 1);
        }

        // Persist (clear old scores for this posting first)
        matchScoreRepository.deleteByJobPostingId(jobPosting.getId());
        List<MatchScore> savedScores = matchScoreRepository.saveAll(scores);
        applicationService.ensureRecommendedForScores(savedScores, null, "ATS_SCORE");
        return savedScores;
    }

    // Candidate-side: score one candidate against one job (no persistence)
    public double computeScore(Candidate candidate, JobPosting job) {
        Set<String> requiredTags = parseTags(job.getRequiredSkills());
        double pct = calculateMatch(parseTags(candidate.getParsedSkills()), requiredTags);
        pct += preferenceBonus(candidate, job);
        return Math.min(pct, 100.0);
    }

    private double calculateMatch(Set<String> candidateTags, Set<String> requiredTags) {
        if (requiredTags.isEmpty()) return 0;
        long matched = candidateTags.stream().filter(requiredTags::contains).count();
        return (double) matched / requiredTags.size() * 100.0;
    }

    // Bonus % for matching location and shift preference (up to +10)
    private double preferenceBonus(Candidate candidate, JobPosting job) {
        double bonus = 0;
        if (job.getLocation() != null && job.getLocation().equalsIgnoreCase(candidate.getPreferredLocation())) {
            bonus += 5;
        }
        if (job.getShift() != null && job.getShift().equalsIgnoreCase(candidate.getPreferredShift())) {
            bonus += 5;
        }
        return bonus;
    }

    private Set<String> parseTags(String commaSeparated) {
        if (commaSeparated == null || commaSeparated.isBlank()) return Set.of();
        return Arrays.stream(commaSeparated.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
    }
}
