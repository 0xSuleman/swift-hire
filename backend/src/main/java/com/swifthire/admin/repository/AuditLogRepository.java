package com.swifthire.admin.repository;

import com.swifthire.admin.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findAllByOrderByPerformedAtDesc();
}
