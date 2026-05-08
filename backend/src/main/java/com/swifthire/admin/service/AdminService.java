package com.swifthire.admin.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.swifthire.admin.model.AuditLog;
import com.swifthire.automation.model.NotificationLog;
import com.swifthire.automation.repository.NotificationLogRepository;
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

import java.util.ArrayList;
import java.util.Comparator;
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
    private final NotificationLogRepository notificationLogRepository;
    private final ObjectMapper objectMapper;

    public List<Map<String, Object>> getUsers(String role, Double maxRating, String status, String search) {
        Role roleEnum     = role   != null ? Role.valueOf(role.toUpperCase())                 : null;
        AccountStatus statusEnum = status != null ? AccountStatus.valueOf(status.toUpperCase()) : null;

        List<User> users;
        if (roleEnum != null && statusEnum != null) {
            users = userRepository.findByRoleAndAccountStatus(roleEnum, statusEnum);
        } else if (roleEnum != null) {
            users = userRepository.findByRole(roleEnum);
        } else if (statusEnum != null) {
            users = userRepository.findByAccountStatus(statusEnum);
        } else {
            users = userRepository.findAll();
        }

        if (maxRating != null) {
            final double cap = maxRating;
            users = users.stream().filter(u -> u.getAverageRating() <= cap).toList();
        }

        if (search != null && !search.isBlank()) {
            final String q = search.trim().toLowerCase();
            users = users.stream()
                    .filter(u -> (u.getName() != null && u.getName().toLowerCase().contains(q))
                              || u.getEmail().toLowerCase().contains(q))
                    .toList();
        }

        return users.stream().filter(User::isEmailVerified).filter(u -> u.getRole() != Role.ADMIN).map(u -> {
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

        if (user.getRole() == Role.CANDIDATE) {
            candidateRepository.findByUserId(userId).ifPresent(c -> {
                m.put("parsedSkills",      c.getParsedSkills());
                m.put("profileViews",      c.getProfileViews());
                m.put("preferredLocation", c.getPreferredLocation());
                m.put("preferredShift",    c.getPreferredShift());
                m.put("workType",          c.getWorkType());
                if (c.getHiredAt() != null) {
                    m.put("hiredAt",          c.getHiredAt().toString());
                    m.put("hiredCompanyName", c.getHiredCompanyName());
                    m.put("hiredJobTitle",    c.getHiredJobTitle());
                }
            });
        } else if (user.getRole() == Role.EMPLOYER) {
            employerRepository.findByUserId(userId).ifPresent(e -> {
                m.put("companyName",     e.getCompanyName());
                m.put("companyLocation", e.getCompanyLocation());
                m.put("jobCount",        jobPostingRepository.findByEmployer(e).size());
            });
        }
        return m;
    }

    @Transactional
    public void updateUserStatus(Long userId, String action, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (user.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Admin accounts cannot be modified.");
        }

        AccountStatus newStatus = switch (action.toLowerCase()) {
            case "approve" -> AccountStatus.ACTIVE;
            case "block"   -> AccountStatus.BANNED;
            case "delete"  -> AccountStatus.DEACTIVATED;
            default -> throw new IllegalArgumentException("Invalid action. Use: approve, block, delete.");
        };

        if (user.getAccountStatus() == newStatus) {
            throw new IllegalArgumentException(
                "User is already " + newStatus.name().toLowerCase() + ".");
        }

        user.setAccountStatus(newStatus);
        if (newStatus == AccountStatus.ACTIVE) {
            user.setFailedLoginAttempts(0);
        }
        userRepository.save(user);

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

        if (user.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Admin accounts cannot be deleted.");
        }

        reviewRepository.deleteAll(reviewRepository.findByRater(user));
        reviewRepository.deleteAll(reviewRepository.findByRatee(user));

        if (user.getRole() == Role.CANDIDATE) {
            var candidate = candidateRepository.findByUserId(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found."));
            slotRepository.deleteAll(slotRepository.findByCandidate(candidate));
            matchScoreRepository.deleteByCandidate(candidate);
            resetTokenRepository.deleteByUserId(userId);
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
            employerRepository.delete(employer);
        }

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

    @Transactional
    public Map<String, Object> generateReport(String category, String from, String to,
                                               String userType, String adminEmail) {
        Map<String, Object> reportData = new LinkedHashMap<>();

        switch (category.toLowerCase()) {
            case "users" -> {
                Role filterRole = (userType != null && !userType.isBlank())
                        ? Role.valueOf(userType.toUpperCase()) : null;
                List<User> allUsers = filterRole != null
                        ? userRepository.findByRole(filterRole)
                        : userRepository.findAll().stream()
                            .filter(u -> u.getRole() != Role.ADMIN).toList();
                allUsers = allUsers.stream().filter(User::isEmailVerified).toList();

                reportData.put("totalUsers",  allUsers.size());
                reportData.put("totalCandidates", allUsers.stream().filter(u -> u.getRole() == Role.CANDIDATE).count());
                reportData.put("totalEmployers",  allUsers.stream().filter(u -> u.getRole() == Role.EMPLOYER).count());
                reportData.put("active",      allUsers.stream().filter(u -> u.getAccountStatus() == AccountStatus.ACTIVE).count());
                reportData.put("banned",      allUsers.stream().filter(u -> u.getAccountStatus() == AccountStatus.BANNED).count());
                reportData.put("deactivated", allUsers.stream().filter(u -> u.getAccountStatus() == AccountStatus.DEACTIVATED).count());

                if (filterRole == null || filterRole == Role.CANDIDATE) {
                    List<Map<String, Object>> candidateRecords = allUsers.stream()
                            .filter(u -> u.getRole() == Role.CANDIDATE)
                            .map(u -> {
                                Map<String, Object> r = new LinkedHashMap<>();
                                r.put("name",          u.getName());
                                r.put("email",         u.getEmail());
                                r.put("status",        u.getAccountStatus().name());
                                r.put("averageRating", u.getAverageRating());
                                r.put("totalRatings",  u.getTotalRatings());
                                r.put("memberSince",   u.getCreatedAt() != null ? u.getCreatedAt().toLocalDate().toString() : "");
                                candidateRepository.findByUserId(u.getId()).ifPresent(c -> {
                                    r.put("location",     c.getPreferredLocation());
                                    r.put("shift",        c.getPreferredShift());
                                    r.put("workType",     c.getWorkType());
                                    r.put("profileViews", c.getProfileViews());
                                    r.put("skills",       c.getParsedSkills());
                                    r.put("hired",        c.getHiredAt() != null);
                                    r.put("hiredCompany", c.getHiredCompanyName());
                                });
                                return r;
                            }).toList();
                    reportData.put("candidateRecords", candidateRecords);
                }

                if (filterRole == null || filterRole == Role.EMPLOYER) {
                    List<Map<String, Object>> employerRecords = allUsers.stream()
                            .filter(u -> u.getRole() == Role.EMPLOYER)
                            .map(u -> {
                                Map<String, Object> r = new LinkedHashMap<>();
                                r.put("name",          u.getName());
                                r.put("email",         u.getEmail());
                                r.put("status",        u.getAccountStatus().name());
                                r.put("averageRating", u.getAverageRating());
                                r.put("totalRatings",  u.getTotalRatings());
                                r.put("memberSince",   u.getCreatedAt() != null ? u.getCreatedAt().toLocalDate().toString() : "");
                                employerRepository.findByUserId(u.getId()).ifPresent(e -> {
                                    r.put("companyName",     e.getCompanyName());
                                    r.put("companyLocation", e.getCompanyLocation());
                                    r.put("jobCount",        jobPostingRepository.findByEmployer(e).size());
                                });
                                return r;
                            }).toList();
                    reportData.put("employerRecords", employerRecords);
                }
            }
            case "jobs" -> {
                List<JobPosting> allJobs = jobPostingRepository.findAll();
                reportData.put("totalJobs", allJobs.size());
                reportData.put("open",      allJobs.stream().filter(j -> j.getStatus() == JobPosting.JobStatus.OPEN).count());
                reportData.put("closed",    allJobs.stream().filter(j -> j.getStatus() == JobPosting.JobStatus.CLOSED).count());
                reportData.put("archived",  allJobs.stream().filter(j -> j.getStatus() == JobPosting.JobStatus.ARCHIVED).count());

                List<Map<String, Object>> records = allJobs.stream().map(j -> {
                    Map<String, Object> r = new LinkedHashMap<>();
                    r.put("title",           j.getJobTitle());
                    r.put("employer",        j.getEmployer().getUser().getName());
                    r.put("companyName",     j.getEmployer().getCompanyName());
                    r.put("companyEmail",    j.getEmployer().getUser().getEmail());
                    r.put("companyLocation", j.getEmployer().getCompanyLocation());
                    r.put("status",          j.getStatus().name());
                    r.put("location",        j.getLocation());
                    r.put("shift",           j.getShift());
                    r.put("experienceYears", j.getExperienceYears());
                    r.put("requiredSkills",  j.getRequiredSkills());
                    return r;
                }).toList();
                reportData.put("records", records);
            }
            case "ratings" -> {
                List<User> rated = userRepository.findAll().stream()
                        .filter(u -> u.isEmailVerified() && u.getRole() != Role.ADMIN && u.getTotalRatings() > 0)
                        .sorted(Comparator.comparingDouble(User::getAverageRating).reversed())
                        .toList();
                double avg = rated.stream().mapToDouble(User::getAverageRating).average().orElse(0.0);
                reportData.put("platformAverageRating", Math.round(avg * 100.0) / 100.0);
                reportData.put("totalReviews",   reviewRepository.count());
                reportData.put("usersWithRatings", rated.size());

                List<Map<String, Object>> candidateRecords = rated.stream()
                        .filter(u -> u.getRole() == Role.CANDIDATE)
                        .map(u -> {
                            Map<String, Object> r = new LinkedHashMap<>();
                            r.put("name",          u.getName());
                            r.put("email",         u.getEmail());
                            r.put("averageRating", u.getAverageRating());
                            r.put("totalRatings",  u.getTotalRatings());
                            candidateRepository.findByUserId(u.getId()).ifPresent(c -> {
                                r.put("location", c.getPreferredLocation());
                                r.put("shift",    c.getPreferredShift());
                                r.put("workType", c.getWorkType());
                            });
                            return r;
                        }).toList();
                reportData.put("candidateRecords", candidateRecords);

                List<Map<String, Object>> employerRecords = rated.stream()
                        .filter(u -> u.getRole() == Role.EMPLOYER)
                        .map(u -> {
                            Map<String, Object> r = new LinkedHashMap<>();
                            r.put("name",          u.getName());
                            r.put("email",         u.getEmail());
                            r.put("averageRating", u.getAverageRating());
                            r.put("totalRatings",  u.getTotalRatings());
                            employerRepository.findByUserId(u.getId()).ifPresent(e -> {
                                r.put("companyName",     e.getCompanyName());
                                r.put("companyLocation", e.getCompanyLocation());
                            });
                            return r;
                        }).toList();
                reportData.put("employerRecords", employerRecords);
            }
            case "analytics" -> {
                reportData.put("totalInterviews",  slotRepository.count());
                reportData.put("totalJobPostings", jobPostingRepository.count());
                reportData.put("totalCandidates",  userRepository.findByRole(Role.CANDIDATE).size());
                reportData.put("totalEmployers",   userRepository.findByRole(Role.EMPLOYER).size());
                reportData.put("totalReviews",     reviewRepository.count());
                reportData.put("hiredCandidates",  candidateRepository.findAll().stream().filter(c -> c.getHiredAt() != null).count());
            }
            default -> throw new IllegalArgumentException("Invalid filter. Please enter valid criteria.");
        }

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

    @SuppressWarnings("unchecked")
    public String exportReportCsv(String category, String from, String to, String userType, String adminEmail) {
        Map<String, Object> data = generateReport(category, from, to, userType, adminEmail);
        StringBuilder csv = new StringBuilder();
        boolean wrote = false;

        for (String key : new String[]{"candidateRecords", "employerRecords"}) {
            Object obj = data.get(key);
            if (obj instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof Map) {
                List<Map<String, Object>> rows = (List<Map<String, Object>>) list;
                if (wrote) csv.append('\n');
                csv.append(key.equals("candidateRecords") ? "CANDIDATES\n" : "EMPLOYERS\n");
                csv.append(String.join(",", rows.get(0).keySet())).append('\n');
                for (Map<String, Object> row : rows) {
                    csv.append(row.values().stream()
                            .map(v -> v == null ? "" : v.toString().replace(",", ";"))
                            .reduce("", (a, b) -> a.isEmpty() ? b : a + "," + b))
                       .append('\n');
                }
                wrote = true;
            }
        }

        if (!wrote) {
            Object recordsObj = data.get("records");
            if (recordsObj instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof Map) {
                List<Map<String, Object>> records = (List<Map<String, Object>>) list;
                csv.append(String.join(",", records.get(0).keySet())).append('\n');
                for (Map<String, Object> row : records) {
                    csv.append(row.values().stream()
                            .map(v -> v == null ? "" : v.toString().replace(",", ";"))
                            .reduce("", (a, b) -> a.isEmpty() ? b : a + "," + b))
                       .append('\n');
                }
            } else {
                csv.append("key,value\n");
                for (Map.Entry<String, Object> entry : data.entrySet()) {
                    if (!(entry.getValue() instanceof List)) {
                        csv.append(entry.getKey()).append(',').append(entry.getValue()).append('\n');
                    }
                }
            }
        }
        return csv.toString();
    }

    public List<Map<String, Object>> getUserInterviews(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        List<Map<String, Object>> result = new ArrayList<>();

        if (user.getRole() == Role.CANDIDATE) {
            var candidate = candidateRepository.findByUserId(userId).orElse(null);
            if (candidate == null) return result;
            slotRepository.findByCandidate(candidate).stream()
                    .sorted((a, b) -> b.getStartTime().compareTo(a.getStartTime()))
                    .forEach(slot -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("id",           slot.getId());
                        m.put("jobTitle",     slot.getJobPosting().getJobTitle());
                        m.put("companyName",  slot.getJobPosting().getEmployer().getCompanyName());
                        m.put("startTime",    slot.getStartTime().toString());
                        m.put("endTime",      slot.getEndTime().toString());
                        m.put("status",       slot.getStatus().name());
                        m.put("calendlyLink", slot.getCalendlyLink());
                        result.add(m);
                    });
        } else if (user.getRole() == Role.EMPLOYER) {
            var employer = employerRepository.findByUserId(userId).orElse(null);
            if (employer == null) return result;
            slotRepository.findByWindow_Employer(employer).stream()
                    .sorted((a, b) -> b.getStartTime().compareTo(a.getStartTime()))
                    .forEach(slot -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("id",             slot.getId());
                        m.put("candidateName",  slot.getCandidate().getUser().getName());
                        m.put("candidateEmail", slot.getCandidate().getUser().getEmail());
                        m.put("jobTitle",       slot.getJobPosting().getJobTitle());
                        m.put("startTime",      slot.getStartTime().toString());
                        m.put("endTime",        slot.getEndTime().toString());
                        m.put("status",         slot.getStatus().name());
                        m.put("calendlyLink",   slot.getCalendlyLink());
                        result.add(m);
                    });
        }
        return result;
    }

    public List<Map<String, Object>> getUserReviews(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        var reviews = reviewRepository.findByRatee(user);
        reviews.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        return reviews.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",          r.getId());
            m.put("raterName",   r.getRater().getName());
            m.put("raterRole",   r.getRater().getRole().name());
            m.put("ratingValue", r.getRatingValue());
            m.put("comment",     r.getComment());
            m.put("createdAt",   r.getCreatedAt().toString());
            return m;
        }).toList();
    }

    @Transactional
    public List<Map<String, Object>> getUserActivity(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        List<Map<String, Object>> events = new ArrayList<>();

        Map<String, Object> reg = new LinkedHashMap<>();
        reg.put("type",      "REGISTERED");
        reg.put("label",     "Joined Swift Hire");
        reg.put("timestamp", user.getCreatedAt().toString());
        events.add(reg);

        reviewRepository.findByRatee(user).forEach(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("type",      "REVIEW_RECEIVED");
            m.put("label",     "Received " + r.getRatingValue() + "★ review from " + r.getRater().getName());
            m.put("timestamp", r.getCreatedAt().toString());
            events.add(m);
        });

        reviewRepository.findByRater(user).forEach(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("type",      "REVIEW_WRITTEN");
            m.put("label",     "Wrote " + r.getRatingValue() + "★ review for " + r.getRatee().getName());
            m.put("timestamp", r.getCreatedAt().toString());
            events.add(m);
        });

        if (user.getRole() == Role.EMPLOYER) {
            employerRepository.findByUserId(userId).ifPresent(employer ->
                    jobPostingRepository.findByEmployer(employer).forEach(j -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("type",      "JOB_POSTED");
                        m.put("label",     "Posted job: " + j.getJobTitle());
                        m.put("timestamp", j.getCreatedAt().toString());
                        events.add(m);
                    })
            );
        }

        events.sort((a, b) -> ((String) b.get("timestamp")).compareTo((String) a.get("timestamp")));
        return events;
    }

    public Map<String, Object> getAdminAnalytics() {
        Map<String, Object> m = new LinkedHashMap<>();

        List<User> allUsers = userRepository.findAll().stream()
                .filter(u -> u.isEmailVerified() && u.getRole() != Role.ADMIN).toList();
        long totalCandidates = allUsers.stream().filter(u -> u.getRole() == Role.CANDIDATE).count();
        long totalEmployers  = allUsers.stream().filter(u -> u.getRole() == Role.EMPLOYER).count();
        m.put("totalUsers",       (long) allUsers.size());
        m.put("totalCandidates",  totalCandidates);
        m.put("totalEmployers",   totalEmployers);
        m.put("activeUsers",      allUsers.stream().filter(u -> u.getAccountStatus() == AccountStatus.ACTIVE).count());
        m.put("bannedUsers",      allUsers.stream().filter(u -> u.getAccountStatus() == AccountStatus.BANNED).count());
        m.put("deactivatedUsers", allUsers.stream().filter(u -> u.getAccountStatus() == AccountStatus.DEACTIVATED).count());

        List<JobPosting> allJobs = jobPostingRepository.findAll();
        m.put("totalJobs",    (long) allJobs.size());
        m.put("openJobs",     allJobs.stream().filter(j -> j.getStatus() == JobPosting.JobStatus.OPEN).count());
        m.put("closedJobs",   allJobs.stream().filter(j -> j.getStatus() == JobPosting.JobStatus.CLOSED).count());
        m.put("archivedJobs", allJobs.stream().filter(j -> j.getStatus() == JobPosting.JobStatus.ARCHIVED).count());

        long totalInterviews = slotRepository.count();
        long totalReviews    = reviewRepository.count();
        long hiredCandidates = candidateRepository.findAll().stream().filter(c -> c.getHiredAt() != null).count();
        m.put("totalInterviews", totalInterviews);
        m.put("totalReviews",    totalReviews);
        m.put("hiredCandidates", hiredCandidates);

        double avgRating = allUsers.stream()
                .filter(u -> u.getTotalRatings() > 0)
                .mapToDouble(User::getAverageRating).average().orElse(0.0);
        m.put("platformAverageRating", Math.round(avgRating * 100.0) / 100.0);

        List<Map<String, Object>> topEmployers = employerRepository.findAll().stream()
                .map(e -> {
                    Map<String, Object> em = new LinkedHashMap<>();
                    String label = (e.getCompanyName() != null && !e.getCompanyName().isBlank())
                            ? e.getCompanyName() : e.getUser().getName();
                    em.put("label",    label);
                    em.put("jobCount", (long) jobPostingRepository.findByEmployer(e).size());
                    return em;
                })
                .filter(em -> (long) em.get("jobCount") > 0)
                .sorted(Comparator.comparingLong(em -> -(long) em.get("jobCount")))
                .limit(8)
                .toList();
        m.put("topEmployers", topEmployers);

        return m;
    }

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

    public List<NotificationLog> getNotificationLogs() {
        return notificationLogRepository.findAllByOrderBySentAtDesc();
    }
}
