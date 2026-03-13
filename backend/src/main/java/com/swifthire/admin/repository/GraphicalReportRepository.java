package com.swifthire.admin.repository;

import com.swifthire.admin.model.GraphicalReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GraphicalReportRepository extends JpaRepository<GraphicalReport, Long> {
    List<GraphicalReport> findByReportTypeOrderByGeneratedAtDesc(String reportType);
    List<GraphicalReport> findAllByOrderByGeneratedAtDesc();
}
