package com.swifthire.job.repository;

import com.swifthire.job.model.HiringPrompt;
import com.swifthire.job.model.JobPosting;
import com.swifthire.user.model.Employer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HiringPromptRepository extends JpaRepository<HiringPrompt, Long> {
    Optional<HiringPrompt> findByJobPosting(JobPosting jobPosting);
    List<HiringPrompt> findByEmployerOrderBySubmissionDateDesc(Employer employer);
}
