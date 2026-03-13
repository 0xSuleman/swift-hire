package com.swifthire.admin.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.swifthire.admin.model.GraphicalReport;
import com.swifthire.admin.repository.GraphicalReportRepository;
import com.swifthire.common.exception.ResourceNotFoundException;
import com.swifthire.job.model.JobPosting;
import com.swifthire.job.repository.JobPostingRepository;
import com.swifthire.review.repository.ReviewRepository;
import com.swifthire.scheduling.repository.InterviewSlotRepository;
import com.swifthire.user.model.AccountStatus;
import com.swifthire.user.model.Role;
import com.swifthire.user.model.User;
import com.swifthire.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final JobPostingRepository jobPostingRepository;
    private final ReviewRepository reviewRepository;
    private final InterviewSlotRepository slotRepository;
    private final GraphicalReportRepository graphicalReportRepository;
    private final ObjectMapper objectMapper;

    public List<Map<String, Object>> getUsers(String role, Double maxRating, String status) {
        List<User> users;

        if (maxRating != null && role != null) {
            users = userRepository.findByMaxRatingAndRole(maxRating, Role.valueOf(role.toUpperCase()));
        } else if (role != null) {
            users = userRepository.findByRole(Role.valueOf(role.toUpperCase()));
        } else if (status != null) {
            users = userRepository.findByAccountStatus(AccountStatus.valueOf(status.toUpperCase()));
        } else {
            users = userRepository.findAll();
        }

        if (users.isEmpty()) {
            throw new IllegalArgumentException("No users found matching the criteria.");
        }

        return users.stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",            u.getId());
            m.put("name",          u.getName());
            m.put("email",         u.getEmail());
            m.put("role",          u.getRole().name());
            m.put("status",        u.getAccountStatus().name());
            m.put("averageRating", u.getAverageRating());
            return m;
        }).toList();
    }

    public Map<String, Object> getUserDetail(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",            user.getId());
        m.put("name",          user.getName());
        m.put("email",         user.getEmail());
        m.put("role",          user.getRole().name());
        m.put("status",        user.getAccountStatus().name());
        m.put("averageRating", user.getAverageRating());
        m.put("totalRatings",  user.getTotalRatings());
        m.put("createdAt",     user.getCreatedAt().toString());
        return m;
    }

    @Transactional
    public void updateUserStatus(Long userId, String action) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        AccountStatus newStatus = switch (action.toLowerCase()) {
            case "approve" -> AccountStatus.ACTIVE;
            case "block"   -> AccountStatus.BANNED;
            case "delete"  -> AccountStatus.DEACTIVATED;
            default -> throw new IllegalArgumentException("Invalid action. Use: approve, block, delete.");
        };

        if (user.getAccountStatus() == newStatus) {
            throw new IllegalArgumentException("Action already active.");
        }

        user.setAccountStatus(newStatus);
        userRepository.save(user);
    }

    // UC-14 + ACD: generateGraphicalReport() — aggregates data and persists a GraphicalReport
    @Transactional
    public Map<String, Object> generateReport(String category, String from, String to,
                                               String userType, String adminEmail) {
        Map<String, Object> reportData = new LinkedHashMap<>();

        switch (category.toLowerCase()) {
            case "users" -> {
                reportData.put("totalUsers",   userRepository.count());
                reportData.put("candidates",   userRepository.findByRole(Role.CANDIDATE).size());
                reportData.put("employers",    userRepository.findByRole(Role.EMPLOYER).size());
                reportData.put("admins",       userRepository.findByRole(Role.ADMIN).size());
                reportData.put("active",       userRepository.findByAccountStatus(AccountStatus.ACTIVE).size());
                reportData.put("banned",       userRepository.findByAccountStatus(AccountStatus.BANNED).size());
                reportData.put("deactivated",  userRepository.findByAccountStatus(AccountStatus.DEACTIVATED).size());
            }
            case "jobs" -> {
                reportData.put("totalJobs",  jobPostingRepository.count());
                reportData.put("open",       jobPostingRepository.findByStatus(JobPosting.JobStatus.OPEN).size());
                reportData.put("closed",     jobPostingRepository.findByStatus(JobPosting.JobStatus.CLOSED).size());
                reportData.put("archived",   jobPostingRepository.findByStatus(JobPosting.JobStatus.ARCHIVED).size());
            }
            case "ratings" -> {
                List<User> all = userRepository.findAll();
                double avg = all.stream()
                        .filter(u -> u.getTotalRatings() > 0)
                        .mapToDouble(User::getAverageRating)
                        .average().orElse(0.0);
                reportData.put("platformAverageRating", Math.round(avg * 100.0) / 100.0);
                reportData.put("totalReviews",          reviewRepository.count());
                reportData.put("usersWithRatings",      all.stream().filter(u -> u.getTotalRatings() > 0).count());
            }
            case "analytics" -> {
                reportData.put("totalInterviews",   slotRepository.count());
                reportData.put("totalJobPostings",  jobPostingRepository.count());
                reportData.put("totalCandidates",   userRepository.findByRole(Role.CANDIDATE).size());
                reportData.put("totalEmployers",    userRepository.findByRole(Role.EMPLOYER).size());
            }
            default -> throw new IllegalArgumentException(
                    "Unknown category. Use: users, jobs, ratings, analytics.");
        }

        // Persist GraphicalReport (ACD: Admin Views GraphicalReport 1:0..*)
        User admin = userRepository.findByEmail(adminEmail).orElse(null);
        String json;
        try {
            json = objectMapper.writeValueAsString(reportData);
        } catch (JsonProcessingException e) {
            json = reportData.toString();
        }
        graphicalReportRepository.save(GraphicalReport.builder()
                .reportType(category)
                .dateRangeFrom(from)
                .dateRangeTo(to)
                .generatedBy(admin)
                .data(json)
                .build());

        return reportData;
    }

    // UC-14: list previously generated reports
    public List<Map<String, Object>> getReportHistory() {
        return graphicalReportRepository.findAllByOrderByGeneratedAtDesc().stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",            r.getId());
            m.put("reportType",    r.getReportType());
            m.put("dateRangeFrom", r.getDateRangeFrom());
            m.put("dateRangeTo",   r.getDateRangeTo());
            m.put("generatedAt",   r.getGeneratedAt().toString());
            m.put("data",          r.getData());
            return m;
        }).toList();
    }
}
