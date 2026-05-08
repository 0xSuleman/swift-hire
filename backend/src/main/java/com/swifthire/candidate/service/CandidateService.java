package com.swifthire.candidate.service;

import com.swifthire.common.exception.ResourceNotFoundException;
import com.swifthire.job.model.JobPosting;
import com.swifthire.job.model.MatchScore;
import com.swifthire.job.repository.JobPostingRepository;
import com.swifthire.job.repository.MatchScoreRepository;
import com.swifthire.job.service.AtsScoreService;
import com.swifthire.scheduling.model.InterviewSlot;
import com.swifthire.scheduling.repository.InterviewSlotRepository;
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
import java.util.Comparator;

@Service
@RequiredArgsConstructor
public class CandidateService {

    private final CandidateRepository candidateRepository;
    private final UserRepository userRepository;
    private final CvParserService cvParserService;
    private final JobPostingRepository jobPostingRepository;
    private final MatchScoreRepository matchScoreRepository;
    private final AtsScoreService atsScoreService;
    private final InterviewSlotRepository slotRepository;

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
        if (candidate.getHiredAt() != null) {
            profile.put("hiredAt",           candidate.getHiredAt().toString());
            profile.put("hiredCompanyName",  candidate.getHiredCompanyName());
            profile.put("hiredJobTitle",     candidate.getHiredJobTitle());
            profile.put("hiredEmployerEmail",candidate.getHiredEmployerEmail());
        }
        return profile;
    }

    @Transactional
    public void updateProfile(String email, Map<String, String> updates) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        if (updates.containsKey("name") && updates.get("name") != null && !updates.get("name").isBlank())
            user.setName(updates.get("name").trim());
        if (updates.containsKey("phoneNo") && updates.get("phoneNo") != null)
            user.setPhoneNo(updates.get("phoneNo").trim());
        if (updates.containsKey("address") && updates.get("address") != null)
            user.setAddress(updates.get("address").trim());
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
        matchScoreRepository.deleteByCandidate(candidate);
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

    // UC-11 extended: Returns all jobs a candidate has been matched to, with derived status
    public List<Map<String, Object>> getMyApplications(String email) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        var candidate = candidateRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found."));

        List<MatchScore> scores = matchScoreRepository.findByCandidateOrderByMatchPercentageDesc(candidate);
        List<InterviewSlot> allSlots = slotRepository.findByCandidate(candidate);

        return scores.stream().map(ms -> {
            JobPosting job = ms.getJobPosting();
            InterviewSlot slot = allSlots.stream()
                    .filter(s -> s.getJobPosting().getId().equals(job.getId()))
                    .max(Comparator.comparing(s -> s.getStatus().ordinal()))
                    .orElse(null);

            String status = deriveStatus(candidate, slot);

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("jobId",        job.getId());
            m.put("jobTitle",     job.getJobTitle());
            m.put("companyName",  job.getEmployer().getCompanyName());
            m.put("matchScore",   ms.getMatchPercentage());
            m.put("status",       status);
            m.put("interviewDate", slot != null ? slot.getStartTime().toString() : null);
            return m;
        }).toList();
    }

    private String deriveStatus(Candidate candidate, InterviewSlot slot) {
        if (candidate.getHiredAt() != null) return "HIRED";
        if (slot == null) return "RECOMMENDED";
        return switch (slot.getStatus()) {
            case COMPLETED -> "COMPLETED";
            case CONFIRMED -> "CONFIRMED";
            case PENDING   -> "SCHEDULED";
            default        -> "RECOMMENDED";
        };
    }
}
