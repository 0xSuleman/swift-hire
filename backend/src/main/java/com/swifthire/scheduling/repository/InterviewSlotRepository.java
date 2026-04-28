package com.swifthire.scheduling.repository;

import com.swifthire.scheduling.model.InterviewSlot;
import com.swifthire.user.model.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface InterviewSlotRepository extends JpaRepository<InterviewSlot, Long> {

    List<InterviewSlot> findByCandidate(Candidate candidate);

    boolean existsByCandidateAndWindow_EmployerAndStatusNot(Candidate candidate, com.swifthire.user.model.Employer employer, InterviewSlot.SlotStatus status);

    // Conflict detection: check for overlapping slots in a window (UC-04)
    @Query("SELECT s FROM InterviewSlot s WHERE s.window.id = :windowId " +
           "AND s.startTime < :end AND s.endTime > :start")
    List<InterviewSlot> findOverlappingSlots(Long windowId, LocalDateTime start, LocalDateTime end);

    // Employer-wide conflict detection: overlapping slots across all their job postings
    @Query("SELECT s FROM InterviewSlot s WHERE s.window.employer.id = :employerId " +
           "AND s.startTime < :end AND s.endTime > :start " +
           "AND s.status <> 'CANCELLED'")
    List<InterviewSlot> findOverlappingSlotsByEmployer(Long employerId, LocalDateTime start, LocalDateTime end);

    // For cron reminder job (UC-15): find slots where interview is approaching
    @Query("SELECT s FROM InterviewSlot s WHERE s.startTime BETWEEN :from AND :to " +
           "AND s.status IN ('PENDING', 'CONFIRMED')")
    List<InterviewSlot> findSlotsBetween(LocalDateTime from, LocalDateTime to);

    List<InterviewSlot> findByJobPostingId(Long jobPostingId);
    List<InterviewSlot> findByWindow_Employer(com.swifthire.user.model.Employer employer);

    @Query("SELECT s FROM InterviewSlot s WHERE s.jobPosting.id IN :jobIds")
    List<InterviewSlot> findByJobPostingIdIn(@Param("jobIds") List<Long> jobIds);

    // Auto-completion cron: find slots whose end time has passed, still in active status
    List<InterviewSlot> findByEndTimeBeforeAndStatusIn(LocalDateTime endTime, List<InterviewSlot.SlotStatus> statuses);
}
