package com.swifthire.user.repository;

import com.swifthire.user.model.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CandidateRepository extends JpaRepository<Candidate, Long> {
    Optional<Candidate> findByUserId(Long userId);

    // Find candidates whose parsedSkills contain any of the given skill tags
    @Query("SELECT c FROM Candidate c WHERE " +
           "LOWER(c.parsedSkills) LIKE LOWER(CONCAT('%', :skill, '%'))")
    List<Candidate> findBySkill(String skill);

    @Query("SELECT c FROM Candidate c WHERE " +
           "(:location IS NULL OR LOWER(c.preferredLocation) = LOWER(:location)) AND " +
           "(:shift IS NULL OR LOWER(c.preferredShift) = LOWER(:shift))")
    List<Candidate> findByPreferences(String location, String shift);
}
