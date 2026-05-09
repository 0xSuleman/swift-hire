package com.swifthire.application.repository;

import com.swifthire.application.model.Application;
import com.swifthire.application.model.ApplicationStatus;
import com.swifthire.job.model.JobPosting;
import com.swifthire.user.model.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    Optional<Application> findByCandidateAndJobPosting(Candidate candidate, JobPosting jobPosting);
    Optional<Application> findByCandidateIdAndJobPostingId(Long candidateId, Long jobPostingId);
    List<Application> findByJobPostingId(Long jobPostingId);
    List<Application> findByCandidate(Candidate candidate);
    List<Application> findByCandidateOrderByUpdatedAtDesc(Candidate candidate);
    List<Application> findByStatusIn(Collection<ApplicationStatus> statuses);
    void deleteByCandidate(Candidate candidate);
    void deleteByJobPostingId(Long jobPostingId);

    @Modifying
    @Query(value = """
            INSERT IGNORE INTO applications
                (candidate_id, job_posting_id, status, created_at, updated_at)
            VALUES
                (:candidateId, :jobPostingId, :status, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6))
            """, nativeQuery = true)
    int insertIgnore(@Param("candidateId") Long candidateId,
                     @Param("jobPostingId") Long jobPostingId,
                     @Param("status") String status);
}
