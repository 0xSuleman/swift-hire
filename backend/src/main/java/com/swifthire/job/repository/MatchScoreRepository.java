package com.swifthire.job.repository;

import com.swifthire.job.model.MatchScore;
import com.swifthire.user.model.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MatchScoreRepository extends JpaRepository<MatchScore, Long> {
    List<MatchScore> findByJobPostingIdOrderByRankingAsc(Long jobPostingId);
    List<MatchScore> findByCandidateOrderByMatchPercentageDesc(Candidate candidate);
    void deleteByJobPostingId(Long jobPostingId);
}
