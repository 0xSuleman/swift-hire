package com.swifthire.job.service;

import com.swifthire.application.service.ApplicationService;
import com.swifthire.job.model.HiringPrompt;
import com.swifthire.job.model.JobPosting;
import com.swifthire.job.repository.HiringPromptRepository;
import com.swifthire.job.repository.JobPostingRepository;
import com.swifthire.job.repository.MatchScoreRepository;
import com.swifthire.scheduling.repository.InterviewSlotRepository;
import com.swifthire.user.model.Employer;
import com.swifthire.user.model.Role;
import com.swifthire.user.model.User;
import com.swifthire.user.repository.CandidateRepository;
import com.swifthire.user.repository.EmployerRepository;
import com.swifthire.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private EmployerRepository employerRepository;
    @Mock private JobPostingRepository jobPostingRepository;
    @Mock private HiringPromptRepository hiringPromptRepository;
    @Mock private MatchScoreRepository matchScoreRepository;
    @Mock private CandidateRepository candidateRepository;
    @Mock private PromptEngineService promptEngineService;
    @Mock private AtsScoreService atsScoreService;
    @Mock private InterviewSlotRepository slotRepository;
    @Mock private ApplicationService applicationService;

    @InjectMocks private JobService jobService;

    @Test
    void processHiringPromptPersistsRawPromptAndParsedResult() {
        User user = User.builder()
                .id(1L)
                .email("employer@swift.test")
                .role(Role.EMPLOYER)
                .build();
        Employer employer = Employer.builder()
                .id(1L)
                .user(user)
                .companyName("Swift Co")
                .build();
        PromptEngineService.ParsedPrompt parsed = new PromptEngineService.ParsedPrompt(
                Set.of("Java", "Spring Boot"),
                Set.of("Lahore"),
                Set.of("night"),
                3,
                "Need Java and Spring Boot in Lahore"
        );

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(employerRepository.findByUserId(1L)).thenReturn(Optional.of(employer));
        when(promptEngineService.parse(parsed.rawText())).thenReturn(parsed);
        when(jobPostingRepository.save(any(JobPosting.class))).thenAnswer(invocation -> {
            JobPosting job = invocation.getArgument(0);
            job.setId(44L);
            return job;
        });
        when(atsScoreService.scoreAndRank(any(JobPosting.class))).thenReturn(List.of());

        var result = jobService.processHiringPrompt(user.getEmail(), parsed.rawText());

        assertThat(result).containsEntry("jobPostingId", 44L);
        assertThat(result).containsEntry("parsedLocation", "Lahore");
        assertThat(result).containsEntry("parsedShift", "night");
        assertThat(result).containsEntry("parsedExperience", 3);

        ArgumentCaptor<HiringPrompt> promptCaptor = ArgumentCaptor.forClass(HiringPrompt.class);
        verify(hiringPromptRepository).save(promptCaptor.capture());
        HiringPrompt savedPrompt = promptCaptor.getValue();
        assertThat(savedPrompt.getRawText()).isEqualTo(parsed.rawText());
        assertThat(savedPrompt.getEmployer()).isEqualTo(employer);
        assertThat(savedPrompt.getJobPosting().getId()).isEqualTo(44L);
        assertThat(savedPrompt.getParsedSkills()).contains("java").contains("spring boot");
        assertThat(savedPrompt.getParsedLocation()).isEqualTo("Lahore");
        assertThat(savedPrompt.getParsedShift()).isEqualTo("night");
        assertThat(savedPrompt.getParsedExperienceYears()).isEqualTo(3);
    }
}
