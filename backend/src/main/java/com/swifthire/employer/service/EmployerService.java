package com.swifthire.employer.service;

import com.swifthire.application.model.ApplicationStatus;
import com.swifthire.application.service.ApplicationService;
import com.swifthire.automation.service.EmailService;
import com.swifthire.common.exception.ResourceNotFoundException;
import com.swifthire.job.model.JobPosting;
import com.swifthire.job.repository.JobPostingRepository;
import com.swifthire.user.model.Candidate;
import com.swifthire.user.repository.CandidateRepository;
import com.swifthire.user.repository.EmployerRepository;
import com.swifthire.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmployerService {

    private final UserRepository userRepository;
    private final EmployerRepository employerRepository;
    private final CandidateRepository candidateRepository;
    private final JobPostingRepository jobPostingRepository;
    private final EmailService emailService;
    private final ApplicationService applicationService;

    public Map<String, Object> getProfile(String email) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        var employer = employerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Employer profile not found."));

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("name", user.getName());
        profile.put("email", user.getEmail());
        profile.put("companyName", employer.getCompanyName());
        profile.put("companyDetails", employer.getCompanyDetails());
        profile.put("companyLocation", employer.getCompanyLocation());
        profile.put("averageRating", user.getAverageRating());
        return profile;
    }

    @Transactional
    public void updateProfile(String email, Map<String, String> updates) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        var employer = employerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Employer profile not found."));

        if (updates.containsKey("companyName")) {
            String v = updates.get("companyName");
            if (v == null || v.isBlank()) throw new IllegalArgumentException("Company name cannot be empty.");
            employer.setCompanyName(v);
        }
        if (updates.containsKey("companyDetails"))  employer.setCompanyDetails(updates.get("companyDetails"));
        if (updates.containsKey("companyLocation")) {
            String v = updates.get("companyLocation");
            if (v == null || v.isBlank()) throw new IllegalArgumentException("Company location cannot be empty.");
            employer.setCompanyLocation(v);
        }
        if (updates.containsKey("name"))            user.setName(updates.get("name"));
        employerRepository.save(employer);
        userRepository.save(user);
    }

    @Transactional
    public void hireCandidate(Long candidateId, Long jobPostingId, String employerEmail) {
        var empUser  = userRepository.findByEmail(employerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        var employer = employerRepository.findByUserId(empUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Employer profile not found."));

        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found."));
        JobPosting job = jobPostingRepository.findById(jobPostingId)
                .orElseThrow(() -> new ResourceNotFoundException("Job posting not found."));

        if (!job.getEmployer().getId().equals(employer.getId()))
            throw new IllegalArgumentException("Job does not belong to this employer.");
        if (candidate.getHiredAt() != null)
            throw new IllegalStateException("Candidate is already hired.");

        candidate.setHiredAt(LocalDateTime.now());
        candidate.setHiredCompanyName(employer.getCompanyName());
        candidate.setHiredJobTitle(job.getJobTitle());
        candidate.setHiredEmployerEmail(empUser.getEmail());
        candidateRepository.save(candidate);
        applicationService.changeStatus(candidate, job, ApplicationStatus.HIRED,
                empUser.getEmail(), "HIRED");

        emailService.sendHireConfirmationToCandidate(
                candidate.getUser().getEmail(), candidate.getUser().getName(),
                employer.getCompanyName(), job.getJobTitle(), empUser.getEmail());
        emailService.sendHireFillConfirmationToEmployer(
                empUser.getEmail(), empUser.getName(),
                candidate.getUser().getName(), candidate.getUser().getEmail(), job.getJobTitle());
    }
}
