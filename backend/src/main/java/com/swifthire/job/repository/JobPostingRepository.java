package com.swifthire.job.repository;

import com.swifthire.job.model.JobPosting;
import com.swifthire.user.model.Employer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {
    List<JobPosting> findByEmployer(Employer employer);
    List<JobPosting> findByStatus(JobPosting.JobStatus status);
}
