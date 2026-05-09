package com.swifthire.application.service;

import com.swifthire.application.model.Application;
import com.swifthire.application.model.ApplicationStatus;
import com.swifthire.application.model.ApplicationStatusHistory;
import com.swifthire.application.repository.ApplicationRepository;
import com.swifthire.application.repository.ApplicationStatusHistoryRepository;
import com.swifthire.job.model.JobPosting;
import com.swifthire.user.model.Candidate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

    @Mock private ApplicationRepository applicationRepository;
    @Mock private ApplicationStatusHistoryRepository historyRepository;

    @InjectMocks private ApplicationService applicationService;

    @Test
    void ensureRecommendedCreatesApplicationAndInitialHistory() {
        Candidate candidate = Candidate.builder().id(10L).build();
        JobPosting job = JobPosting.builder().jobTitle("Java Developer").build();

        when(applicationRepository.findByCandidateAndJobPosting(candidate, job)).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> {
            Application application = invocation.getArgument(0);
            application.setId(99L);
            return application;
        });

        Application result = applicationService.ensureRecommended(candidate, job, "admin@swift.test", "TEST");

        assertThat(result.getStatus()).isEqualTo(ApplicationStatus.RECOMMENDED);
        ArgumentCaptor<ApplicationStatusHistory> history = ArgumentCaptor.forClass(ApplicationStatusHistory.class);
        verify(historyRepository).save(history.capture());
        assertThat(history.getValue().getPreviousStatus()).isNull();
        assertThat(history.getValue().getNewStatus()).isEqualTo(ApplicationStatus.RECOMMENDED);
        assertThat(history.getValue().getActorEmail()).isEqualTo("admin@swift.test");
        assertThat(history.getValue().getSource()).isEqualTo("TEST");
    }

    @Test
    void changeStatusWritesHistoryOnlyWhenStatusChanges() {
        Candidate candidate = Candidate.builder().id(10L).build();
        JobPosting job = JobPosting.builder().jobTitle("Java Developer").build();
        Application existing = Application.builder()
                .id(99L)
                .candidate(candidate)
                .jobPosting(job)
                .status(ApplicationStatus.RECOMMENDED)
                .build();

        when(applicationRepository.findByCandidateAndJobPosting(candidate, job)).thenReturn(Optional.of(existing));
        when(applicationRepository.save(existing)).thenReturn(existing);

        Application result = applicationService.changeStatus(candidate, job,
                ApplicationStatus.SHORTLISTED, "employer@swift.test", "EMPLOYER_ACTION");

        assertThat(result.getStatus()).isEqualTo(ApplicationStatus.SHORTLISTED);
        ArgumentCaptor<ApplicationStatusHistory> history = ArgumentCaptor.forClass(ApplicationStatusHistory.class);
        verify(historyRepository).save(history.capture());
        assertThat(history.getValue().getPreviousStatus()).isEqualTo(ApplicationStatus.RECOMMENDED);
        assertThat(history.getValue().getNewStatus()).isEqualTo(ApplicationStatus.SHORTLISTED);
    }

    @Test
    void changeStatusDoesNotDowngradeHiredApplications() {
        Candidate candidate = Candidate.builder().id(10L).build();
        JobPosting job = JobPosting.builder().jobTitle("Java Developer").build();
        Application existing = Application.builder()
                .id(99L)
                .candidate(candidate)
                .jobPosting(job)
                .status(ApplicationStatus.HIRED)
                .build();

        when(applicationRepository.findByCandidateAndJobPosting(candidate, job)).thenReturn(Optional.of(existing));

        Application result = applicationService.changeStatus(candidate, job,
                ApplicationStatus.REVIEWED, "employer@swift.test", "CANDIDATE_REVIEWED");

        assertThat(result.getStatus()).isEqualTo(ApplicationStatus.HIRED);
        verify(applicationRepository, never()).save(any(Application.class));
        verify(historyRepository, never()).save(any(ApplicationStatusHistory.class));
    }
}
