package com.swifthire.job.service;

import com.swifthire.dictionary.model.KnownSkillsDictionary;
import com.swifthire.dictionary.repository.KnownSkillsDictionaryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * BE3 — Prompt Engine (UC-02)
 * Converts free-text hiring prompt into structured job tags.
 * No external AI API — pure Regex + KnownSkillsDictionary matching.
 * (NFR 3.1.1: ≤3s; NFR 3.4.3: unrecognised input logged)
 */
@Service
@RequiredArgsConstructor
public class PromptEngineService {

    private final KnownSkillsDictionaryRepository dictionaryRepository;

    // Regex to extract years of experience: "3 years", "2yr", "5 yrs"
    private static final Pattern EXPERIENCE_PATTERN =
            Pattern.compile("(\\d+)\\s*(?:year|yr|yrs)s?", Pattern.CASE_INSENSITIVE);

    public ParsedPrompt parse(String rawPrompt) {
        if (rawPrompt == null || rawPrompt.isBlank()) {
            throw new IllegalArgumentException("Prompt cannot be empty.");
        }

        String lower = rawPrompt.toLowerCase();

        Set<String> skills    = matchCategory(lower, KnownSkillsDictionary.SkillCategory.SKILL);
        Set<String> locations = matchCategory(lower, KnownSkillsDictionary.SkillCategory.LOCATION);
        Set<String> shifts    = matchCategory(lower, KnownSkillsDictionary.SkillCategory.SHIFT);
        Integer experience    = extractExperience(lower);

        if (skills.isEmpty() && locations.isEmpty() && shifts.isEmpty()) {
            throw new IllegalArgumentException(
                "Could not identify skills/requirements. Please rewrite the prompt.");
        }

        return new ParsedPrompt(skills, locations, shifts, experience, rawPrompt);
    }

    private Set<String> matchCategory(String text, KnownSkillsDictionary.SkillCategory category) {
        return dictionaryRepository.findByCategory(category).stream()
                .filter(e -> Pattern.compile(
                        "\\b" + Pattern.quote(e.getSkillName().toLowerCase()) + "\\b",
                        Pattern.CASE_INSENSITIVE
                ).matcher(text).find())
                .map(KnownSkillsDictionary::getSkillName)
                .collect(Collectors.toSet());
    }

    private Integer extractExperience(String text) {
        Matcher m = EXPERIENCE_PATTERN.matcher(text);
        return m.find() ? Integer.parseInt(m.group(1)) : null;
    }

    public record ParsedPrompt(
            Set<String> skills,
            Set<String> locations,
            Set<String> shifts,
            Integer experienceYears,
            String rawText
    ) {
        public String jobTitle() {
            return skills.isEmpty() ? "Open Position" : String.join(" / ", skills) + " Developer";
        }

        public String requiredSkillsTag() {
            Set<String> all = new HashSet<>(skills);
            all.addAll(locations);
            all.addAll(shifts);
            return String.join(",", all).toLowerCase();
        }

        public String location() {
            return locations.isEmpty() ? null : locations.iterator().next();
        }

        public String shift() {
            return shifts.isEmpty() ? null : shifts.iterator().next();
        }
    }
}
