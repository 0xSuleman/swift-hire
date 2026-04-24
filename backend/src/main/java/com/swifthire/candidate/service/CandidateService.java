package com.swifthire.candidate.service;

import com.swifthire.common.exception.ResourceNotFoundException;
import com.swifthire.job.model.JobPosting;
import com.swifthire.job.repository.JobPostingRepository;
import com.swifthire.job.service.AtsScoreService;
import com.swifthire.user.model.Candidate;
import com.swifthire.user.repository.CandidateRepository;
import com.swifthire.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CandidateService {

    private final CandidateRepository candidateRepository;
    private final UserRepository userRepository;
    private final CvParserService cvParserService;
    private final JobPostingRepository jobPostingRepository;
    private final AtsScoreService atsScoreService;

    @Value("${app.cv.upload-dir}")
    private String uploadDir;

    public Map<String, Object> getProfile(String email) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        var candidate = candidateRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found."));

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("name", user.getName());
        profile.put("email", user.getEmail());
        profile.put("phoneNo", user.getPhoneNo());
        profile.put("address", user.getAddress());
        profile.put("parsedSkills", candidate.getParsedSkills());
        profile.put("preferredLocation", candidate.getPreferredLocation());
        profile.put("preferredShift", candidate.getPreferredShift());
        profile.put("workType", candidate.getWorkType());
        profile.put("profileViews", candidate.getProfileViews());
        return profile;
    }

    @Transactional
    public void updateProfile(String email, Map<String, String> updates) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        if (updates.containsKey("name"))    user.setName(updates.get("name"));
        if (updates.containsKey("phoneNo")) user.setPhoneNo(updates.get("phoneNo"));
        if (updates.containsKey("address")) user.setAddress(updates.get("address"));
        userRepository.save(user);
    }

    @Transactional
    public void uploadAndParseCV(String email, MultipartFile file) throws IOException {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        var candidate = candidateRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found."));

        // Store file
        Path dir = Paths.get(uploadDir);
        Files.createDirectories(dir);
        String filename = user.getId() + "_cv.pdf";
        Files.copy(file.getInputStream(), dir.resolve(filename),
                java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        candidate.setCvFilePath(dir.resolve(filename).toString());

        // Parse and save skills
        String rawText = cvParserService.extractTextFromPdf(file);
        String skills = cvParserService.parseSkills(rawText);
        candidate.setParsedSkills(skills);
        candidateRepository.save(candidate);
    }

    @Transactional
    public void setPreferences(String email, Map<String, String> prefs) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        var candidate = candidateRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found."));

        if (prefs.containsKey("location")) candidate.setPreferredLocation(prefs.get("location"));
        if (prefs.containsKey("shift"))    candidate.setPreferredShift(prefs.get("shift"));
        if (prefs.containsKey("workType")) candidate.setWorkType(prefs.get("workType"));
        candidateRepository.save(candidate);
    }

    // UC-03: Returns a candidate's public profile for employer view
    public Map<String, Object> getCandidateProfileById(Long candidateId) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found."));
        var user = candidate.getUser();

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("name",              user.getName());
        profile.put("email",             user.getEmail());
        profile.put("phoneNo",           user.getPhoneNo());
        profile.put("averageRating",     user.getAverageRating());
        profile.put("totalRatings",      user.getTotalRatings());
        profile.put("parsedSkills",      candidate.getParsedSkills());
        profile.put("preferredLocation", candidate.getPreferredLocation());
        profile.put("preferredShift",    candidate.getPreferredShift());
        profile.put("workType",          candidate.getWorkType());
        return profile;
    }

    // UC-11: Returns ranked job postings for this candidate
    // Scores this candidate against ALL open jobs on the fly — no employer action required.
    public List<Map<String, Object>> getRecommendedJobs(String email) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        var candidate = candidateRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found."));

        if (candidate.getParsedSkills() == null || candidate.getParsedSkills().isBlank()) {
            throw new IllegalArgumentException("Please complete your profile first.");
        }

        record ScoredJob(JobPosting job, double score) {}

        List<ScoredJob> scored = jobPostingRepository.findByStatus(JobPosting.JobStatus.OPEN)
                .stream()
                .map(job -> new ScoredJob(job, atsScoreService.computeScore(candidate, job)))
                .filter(s -> s.score() > 0)
                .sorted(Comparator.comparingDouble(ScoredJob::score).reversed())
                .toList();

        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 0; i < scored.size(); i++) {
            var s   = scored.get(i);
            var job = s.job();
            var emp = job.getEmployer();
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("jobId",          job.getId());
            entry.put("jobTitle",       job.getJobTitle());
            entry.put("requiredSkills", job.getRequiredSkills());
            entry.put("location",       job.getLocation());
            entry.put("shift",          job.getShift());
            entry.put("experienceYears",job.getExperienceYears());
            entry.put("companyName",    emp.getCompanyName());
            entry.put("companyLocation",emp.getCompanyLocation());
            entry.put("matchScore",     s.score());
            entry.put("ranking",        i + 1);
            result.add(entry);
        }
        return result;
    }
}
