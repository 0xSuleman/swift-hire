package com.swifthire.candidate.service;

import com.swifthire.common.exception.ResourceNotFoundException;
import com.swifthire.job.model.MatchScore;
import com.swifthire.job.repository.MatchScoreRepository;
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
    private final MatchScoreRepository matchScoreRepository;

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
        profile.put("averageRating",     user.getAverageRating());
        profile.put("totalRatings",      user.getTotalRatings());
        profile.put("parsedSkills",      candidate.getParsedSkills());
        profile.put("preferredLocation", candidate.getPreferredLocation());
        profile.put("preferredShift",    candidate.getPreferredShift());
        profile.put("workType",          candidate.getWorkType());
        return profile;
    }

    // UC-11: Returns ranked job postings for this candidate
    public List<Map<String, Object>> getRecommendedJobs(String email) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        var candidate = candidateRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found."));

        if (candidate.getParsedSkills() == null || candidate.getParsedSkills().isBlank()) {
            throw new IllegalArgumentException("Please complete your profile first.");
        }

        return matchScoreRepository
                .findByCandidateOrderByMatchPercentageDesc(candidate)
                .stream()
                .map(ms -> {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("jobId",        ms.getJobPosting().getId());
                    entry.put("jobTitle",     ms.getJobPosting().getJobTitle());
                    entry.put("location",     ms.getJobPosting().getLocation());
                    entry.put("shift",        ms.getJobPosting().getShift());
                    entry.put("matchScore",   ms.getMatchPercentage());
                    entry.put("ranking",      ms.getRanking());
                    return entry;
                })
                .toList();
    }
}
