package com.swifthire.application.service;

import com.swifthire.application.model.Application;
import com.swifthire.application.model.ApplicationStatus;
import com.swifthire.application.model.ApplicationStatusHistory;
import com.swifthire.application.repository.ApplicationRepository;
import com.swifthire.application.repository.ApplicationStatusHistoryRepository;
import com.swifthire.job.model.JobPosting;
import com.swifthire.job.model.MatchScore;
import com.swifthire.user.model.Candidate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final ApplicationStatusHistoryRepository historyRepository;

    @Transactional
    public Application ensureRecommended(Candidate candidate, JobPosting jobPosting, String actorEmail, String source) {
        return ensureApplication(candidate, jobPosting, ApplicationStatus.RECOMMENDED, actorEmail, source);
    }

    @Transactional
    public Application ensureApplication(Candidate candidate, JobPosting jobPosting,
                                         ApplicationStatus initialStatus,
                                         String actorEmail,
                                         String source) {
        return applicationRepository.findByCandidateAndJobPosting(candidate, jobPosting)
                .orElseGet(() -> createApplication(candidate, jobPosting, initialStatus, actorEmail, source));
    }

    @Transactional
    public Application changeStatus(Candidate candidate, JobPosting jobPosting,
                                    ApplicationStatus newStatus,
                                    String actorEmail,
                                    String source) {
        Application application = applicationRepository.findByCandidateAndJobPosting(candidate, jobPosting)
                .orElseGet(() -> createApplication(candidate, jobPosting, newStatus, actorEmail, source));
        if (application.getStatus() == newStatus) {
            return application;
        }
        if (application.getStatus() == ApplicationStatus.HIRED && newStatus != ApplicationStatus.HIRED) {
            return application;
        }
        ApplicationStatus previous = application.getStatus();
        application.setStatus(newStatus);
        Application saved = applicationRepository.save(application);
        writeHistory(saved, previous, newStatus, actorEmail, source);
        return saved;
    }

    @Transactional
    public Application resetToRecommendedIfNonTerminal(Candidate candidate, JobPosting jobPosting,
                                                       String actorEmail,
                                                       String source) {
        Application application = ensureRecommended(candidate, jobPosting, actorEmail, source);
        if (application.getStatus() == ApplicationStatus.HIRED ||
                application.getStatus() == ApplicationStatus.REJECTED) {
            return application;
        }
        return changeStatus(candidate, jobPosting, ApplicationStatus.RECOMMENDED, actorEmail, source);
    }

    @Transactional
    public void ensureRecommendedForScores(Collection<MatchScore> scores, String actorEmail, String source) {
        for (MatchScore score : scores) {
            Long candidateId = score.getCandidate().getId();
            Long jobPostingId = score.getJobPosting().getId();
            int inserted = applicationRepository.insertIgnore(
                    candidateId,
                    jobPostingId,
                    ApplicationStatus.RECOMMENDED.name());
            if (inserted > 0) {
                applicationRepository.findByCandidateIdAndJobPostingId(candidateId, jobPostingId)
                        .ifPresent(app -> writeHistory(app, null, ApplicationStatus.RECOMMENDED, actorEmail, source));
            }
        }
    }

    public Map<Long, Application> findByJobPostingIdMappedByCandidateId(Long jobPostingId) {
        Map<Long, Application> applications = new LinkedHashMap<>();
        applicationRepository.findByJobPostingId(jobPostingId)
                .forEach(app -> applications.put(app.getCandidate().getId(), app));
        return applications;
    }

    public List<Application> findByCandidate(Candidate candidate) {
        return applicationRepository.findByCandidateOrderByUpdatedAtDesc(candidate);
    }

    public List<Application> findHiredApplications() {
        return applicationRepository.findByStatusIn(List.of(ApplicationStatus.HIRED));
    }

    public long countHiredApplications() {
        return applicationRepository.findByStatusIn(List.of(ApplicationStatus.HIRED)).size();
    }

    @Transactional
    public void deleteByCandidate(Candidate candidate) {
        applicationRepository.findByCandidate(candidate)
                .forEach(historyRepository::deleteByApplication);
        applicationRepository.deleteByCandidate(candidate);
    }

    @Transactional
    public void deleteByJobPostingId(Long jobPostingId) {
        applicationRepository.findByJobPostingId(jobPostingId)
                .forEach(historyRepository::deleteByApplication);
        applicationRepository.deleteByJobPostingId(jobPostingId);
    }

    private Application createApplication(Candidate candidate, JobPosting jobPosting,
                                          ApplicationStatus status,
                                          String actorEmail,
                                          String source) {
        Application saved = applicationRepository.save(Application.builder()
                .candidate(candidate)
                .jobPosting(jobPosting)
                .status(status)
                .build());
        writeHistory(saved, null, status, actorEmail, source);
        return saved;
    }

    private void writeHistory(Application application,
                              ApplicationStatus previousStatus,
                              ApplicationStatus newStatus,
                              String actorEmail,
                              String source) {
        historyRepository.save(ApplicationStatusHistory.builder()
                .application(application)
                .previousStatus(previousStatus)
                .newStatus(newStatus)
                .actorEmail(actorEmail)
                .source(source)
                .build());
    }
}
