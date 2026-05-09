package com.swifthire.application.repository;

import com.swifthire.application.model.Application;
import com.swifthire.application.model.ApplicationStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApplicationStatusHistoryRepository extends JpaRepository<ApplicationStatusHistory, Long> {
    List<ApplicationStatusHistory> findByApplicationOrderByChangedAtDesc(Application application);
    void deleteByApplication(Application application);
}
