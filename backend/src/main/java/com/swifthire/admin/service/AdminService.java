package com.swifthire.admin.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.swifthire.admin.model.AuditLog;
import com.swifthire.admin.model.GraphicalReport;
import com.swifthire.admin.repository.AuditLogRepository;
import com.swifthire.admin.repository.GraphicalReportRepository;
import com.swifthire.common.exception.ResourceNotFoundException;
import com.swifthire.auth.repository.PasswordResetTokenRepository;
import com.swifthire.job.model.JobPosting;
import com.swifthire.job.repository.JobPostingRepository;
import com.swifthire.job.repository.MatchScoreRepository;
import com.swifthire.review.repository.ReviewRepository;
import com.swifthire.scheduling.repository.InterviewSlotRepository;
import com.swifthire.scheduling.repository.InterviewWindowRepository;
import com.swifthire.user.model.AccountStatus;
import com.swifthire.user.model.Role;
import com.swifthire.user.model.User;
import com.swifthire.user.repository.CandidateRepository;
import com.swifthire.user.repository.EmployerRepository;
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
    private final CandidateRepository candidateRepository;
    private final EmployerRepository employerRepository;
    private final JobPostingRepository jobPostingRepository;
    private final MatchScoreRepository matchScoreRepository;
    private final ReviewRepository reviewRepository;
    private final InterviewSlotRepository slotRepository;
    private final InterviewWindowRepository windowRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final GraphicalReportRepository graphicalReportRepository;
    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public List<Map<String, Object>> getUsers(String role, Double maxRating, String status) {
        Role roleEnum   = role   != null ? Role.valueOf(role.toUpperCase())                 : null;
        AccountStatus statusEnum = status != null ? AccountStatus.valueOf(status.toUpperCase()) : null;

        List<User> users;
        if (roleEnum != null && statusEnum != null) {
            users = userRepository.findByRoleAndAccountStatus(roleEnum, statusEnum);
            if (maxRating != null) {
                final double cap = maxRating;
                users = users.stream().filter(u -> u.getAverageRating() <= cap).toList();
            }
        } else if (maxRating != null && roleEnum != null) {
            users = userRepository.findByMaxRatingAndRole(maxRating, roleEnum);
        } else if (roleEnum != null) {
            users = userRepository.findByRole(roleEnum);
        } else if (statusEnum != null) {
            users = userRepository.findByAccountStatus(statusEnum);
        } else {
            users = userRepository.findAll();
        }

        return users.stream().filter(User::isEmailVerified).map(u -> {
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
    public void updateUserStatus(Long userId, String action, String adminEmail) {
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
        // Reset lock counter when admin re-activates an account
        if (newStatus == AccountStatus.ACTIVE) {
            user.setFailedLoginAttempts(0);
        }
        userRepository.save(user);

        // NFR 3.8.5 — audit log
        String logAction = action.equalsIgnoreCase("delete") ? "DEACTIVATE" : action.toUpperCase();
        auditLogRepository.save(AuditLog.builder()
                .adminEmail(adminEmail)
                .action(logAction)
                .targetUserId(userId)
                .targetEmail(user.getEmail())
                .build());
    }

    @Transactional
    public void deleteUser(Long userId, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        // Delete all reviews this user gave or received
        reviewRepository.deleteAll(reviewRepository.findByRater(user));
        reviewRepository.deleteAll(reviewRepository.findByRatee(user));

        if (user.getRole() == Role.CANDIDATE) {
            var candidate = candidateRepository.findByUserId(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found."));
            slotRepository.deleteAll(slotRepository.findByCandidate(candidate));
            matchScoreRepository.deleteByCandidate(candidate);
            resetTokenRepository.deleteByUserId(userId);
            auditLogRepository.deleteAll(auditLogRepository.findByTargetUserId(userId));
            candidateRepository.delete(candidate);

        } else if (user.getRole() == Role.EMPLOYER) {
            var employer = employerRepository.findByUserId(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Employer profile not found."));
            List<JobPosting> jobs = jobPostingRepository.findByEmployer(employer);
            for (JobPosting job : jobs) {
                slotRepository.deleteAll(slotRepository.findByJobPostingId(job.getId()));
                matchScoreRepository.deleteByJobPostingId(job.getId());
            }
            jobPostingRepository.deleteAll(jobs);
            windowRepository.deleteAll(windowRepository.findByEmployer(employer));
            resetTokenRepository.deleteByUserId(userId);
            auditLogRepository.deleteAll(auditLogRepository.findByTargetUserId(userId));
            employerRepository.delete(employer);
        }

        // Audit the permanent deletion
        auditLogRepository.save(AuditLog.builder()
                .adminEmail(adminEmail)
                .action("DELETE")
                .targetUserId(userId)
                .targetEmail(user.getEmail())
                .build());

        userRepository.delete(user);
    }

    public void deleteAuditLog(Long id) {
        if (!auditLogRepository.existsById(id)) {
            throw new ResourceNotFoundException("Audit log entry not found.");
        }
        auditLogRepository.deleteById(id);
    }

    // NFR 3.8.5 — retrieve audit log for admin dashboard
    public List<Map<String, Object>> getAuditLogs() {
        return auditLogRepository.findAllByOrderByPerformedAtDesc().stream().map(log -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",            log.getId());
            m.put("adminEmail",    log.getAdminEmail());
            m.put("action",        log.getAction());
            m.put("targetUserId",  log.getTargetUserId());
            m.put("targetEmail",   log.getTargetEmail());
            m.put("performedAt",   log.getPerformedAt().toString());
            return m;
        }).toList();
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
                    "Invalid filter. Please enter valid criteria.");
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

    // UC-14 steps 13-14: Export report as CSV download
    public String exportReportCsv(String category, String from, String to, String adminEmail) {
        Map<String, Object> data = generateReport(category, from, to, null, adminEmail);
        StringBuilder csv = new StringBuilder();
        csv.append("key,value\n");
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            csv.append(entry.getKey()).append(',').append(entry.getValue()).append('\n');
        }
        return csv.toString();
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
