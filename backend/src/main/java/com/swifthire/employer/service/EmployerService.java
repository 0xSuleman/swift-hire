package com.swifthire.employer.service;

import com.swifthire.common.exception.ResourceNotFoundException;
import com.swifthire.user.repository.EmployerRepository;
import com.swifthire.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmployerService {

    private final UserRepository userRepository;
    private final EmployerRepository employerRepository;

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
}
