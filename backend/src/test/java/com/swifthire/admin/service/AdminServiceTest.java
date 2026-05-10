package com.swifthire.admin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swifthire.admin.model.GraphicalReport;
import com.swifthire.admin.repository.AuditLogRepository;
import com.swifthire.admin.repository.GraphicalReportRepository;
import com.swifthire.application.service.ApplicationService;
import com.swifthire.auth.repository.PasswordResetTokenRepository;
import com.swifthire.automation.repository.NotificationLogRepository;
import com.swifthire.job.model.JobPosting;
import com.swifthire.job.model.MatchScore;
import com.swifthire.job.repository.JobPostingRepository;
import com.swifthire.job.repository.MatchScoreRepository;
import com.swifthire.review.repository.ReviewRepository;
import com.swifthire.scheduling.repository.InterviewSlotRepository;
import com.swifthire.scheduling.repository.InterviewWindowRepository;
import com.swifthire.user.model.Candidate;
import com.swifthire.user.model.Employer;
import com.swifthire.user.model.Role;
import com.swifthire.user.model.User;
import com.swifthire.user.repository.CandidateRepository;
import com.swifthire.user.repository.EmployerRepository;
import com.swifthire.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private CandidateRepository candidateRepository;
    @Mock private EmployerRepository employerRepository;
    @Mock private JobPostingRepository jobPostingRepository;
    @Mock private MatchScoreRepository matchScoreRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private InterviewSlotRepository slotRepository;
    @Mock private InterviewWindowRepository windowRepository;
    @Mock private PasswordResetTokenRepository resetTokenRepository;
    @Mock private GraphicalReportRepository graphicalReportRepository;
    @Mock private AuditLogRepository auditLogRepository;
    @Mock private NotificationLogRepository notificationLogRepository;
    @Mock private ApplicationService applicationService;

    private AdminService adminService;

    @BeforeEach
    void setUp() {
        adminService = new AdminService(
                userRepository,
                candidateRepository,
                employerRepository,
                jobPostingRepository,
                matchScoreRepository,
                reviewRepository,
                slotRepository,
                windowRepository,
                resetTokenRepository,
                graphicalReportRepository,
                auditLogRepository,
                notificationLogRepository,
                applicationService,
                new ObjectMapper()
        );
    }

    @Test
    void generateReportRejectsInvalidDateRange() {
        assertThatThrownBy(() -> adminService.generateReport(
                "users", "2026-02-01", "2026-01-01", null, null, "admin@swift.test"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("From date must be before or equal to To date.");
    }

    @Test
    @SuppressWarnings("unchecked")
    void atsReportUsesJobDateFilterAndThreshold() {
        User employerUser = User.builder()
                .id(1L)
                .name("Employer")
                .email("employer@swift.test")
                .role(Role.EMPLOYER)
                .build();
        Employer employer = Employer.builder()
                .id(1L)
                .user(employerUser)
                .companyName("Swift Co")
                .build();
        User candidateUser = User.builder()
                .id(2L)
                .name("Candidate")
                .email("candidate@swift.test")
                .role(Role.CANDIDATE)
                .build();
        Candidate candidate = Candidate.builder()
                .id(2L)
                .user(candidateUser)
                .build();
        JobPosting includedJob = JobPosting.builder()
                .employer(employer)
                .jobTitle("Included")
                .requiredSkills("java")
                .build();
        includedJob.setId(10L);
        includedJob.setCreatedAt(LocalDateTime.of(2026, 1, 15, 10, 0));
        JobPosting excludedJob = JobPosting.builder()
                .employer(employer)
                .jobTitle("Excluded")
                .requiredSkills("python")
                .build();
        excludedJob.setId(11L);
        excludedJob.setCreatedAt(LocalDateTime.of(2026, 3, 15, 10, 0));

        MatchScore lowScore = MatchScore.builder()
                .candidate(candidate)
                .jobPosting(includedJob)
                .matchPercentage(40.0)
                .ranking(2)
                .build();
        MatchScore highScore = MatchScore.builder()
                .candidate(candidate)
                .jobPosting(includedJob)
                .matchPercentage(60.0)
                .ranking(1)
                .build();
        MatchScore excludedScore = MatchScore.builder()
                .candidate(candidate)
                .jobPosting(excludedJob)
                .matchPercentage(90.0)
                .ranking(1)
                .build();

        when(matchScoreRepository.findAll()).thenReturn(List.of(lowScore, highScore, excludedScore));
        when(jobPostingRepository.findAll()).thenReturn(List.of(includedJob, excludedJob));
        when(userRepository.findByEmail("admin@swift.test")).thenReturn(Optional.empty());
        when(graphicalReportRepository.save(any(GraphicalReport.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, Object> report = adminService.generateReport(
                "ats", "2026-01-01", "2026-01-31", null, 50.0, "admin@swift.test");

        assertThat(report).containsEntry("platformAverageAtsScore", 50.0);
        assertThat(report).containsEntry("totalMatchScores", 2);
        assertThat(report).containsEntry("belowThresholdCount", 1L);
        List<Map<String, Object>> records = (List<Map<String, Object>>) report.get("records");
        assertThat(records).hasSize(1);
        assertThat(records.get(0)).containsEntry("jobTitle", "Included");
    }
}
