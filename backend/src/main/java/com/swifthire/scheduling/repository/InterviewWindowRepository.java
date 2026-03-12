package com.swifthire.scheduling.repository;

import com.swifthire.scheduling.model.InterviewWindow;
import com.swifthire.user.model.Employer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InterviewWindowRepository extends JpaRepository<InterviewWindow, Long> {
    List<InterviewWindow> findByEmployer(Employer employer);
}
