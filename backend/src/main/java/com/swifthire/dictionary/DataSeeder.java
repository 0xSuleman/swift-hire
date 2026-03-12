package com.swifthire.dictionary;

import com.swifthire.dictionary.model.KnownSkillsDictionary;
import com.swifthire.dictionary.model.KnownSkillsDictionary.SkillCategory;
import com.swifthire.dictionary.repository.KnownSkillsDictionaryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds KnownSkillsDictionary on startup if empty.
 * BE2 owns this — add more entries as needed.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private final KnownSkillsDictionaryRepository repo;

    @Override
    public void run(ApplicationArguments args) {
        if (repo.count() > 0) return;

        repo.saveAll(skills());
        repo.saveAll(locations());
        repo.saveAll(shifts());

        log.info("KnownSkillsDictionary seeded: {} entries", repo.count());
    }

    private List<KnownSkillsDictionary> skills() {
        String[] names = {
            // Languages
            "java", "python", "javascript", "typescript", "kotlin", "c++", "c#", "go", "ruby", "swift",
            "php", "scala", "rust", "r", "dart",
            // Frameworks & Libraries
            "spring boot", "spring", "react", "angular", "vue", "node.js", "express", "django",
            "flask", "fastapi", "laravel", "asp.net", "flutter", "hibernate", "next.js",
            // Databases
            "mysql", "postgresql", "mongodb", "redis", "oracle", "sqlite", "cassandra",
            "elasticsearch", "firebase",
            // Cloud & DevOps
            "docker", "kubernetes", "aws", "azure", "gcp", "jenkins", "git", "linux",
            "ci/cd", "terraform",
            // Other
            "machine learning", "deep learning", "data science", "restful api", "graphql",
            "microservices", "sql", "html", "css", "tailwind",
        };
        return buildList(names, SkillCategory.SKILL);
    }

    private List<KnownSkillsDictionary> locations() {
        String[] names = {
            "lahore", "karachi", "islamabad", "rawalpindi", "peshawar",
            "multan", "faisalabad", "quetta", "sialkot", "hyderabad",
        };
        return buildList(names, SkillCategory.LOCATION);
    }

    private List<KnownSkillsDictionary> shifts() {
        String[] names = { "day", "night", "remote", "hybrid", "on-site" };
        return buildList(names, SkillCategory.SHIFT);
    }

    private List<KnownSkillsDictionary> buildList(String[] names, SkillCategory category) {
        return java.util.Arrays.stream(names)
                .map(name -> KnownSkillsDictionary.builder()
                        .skillName(name.toLowerCase())
                        .category(category)
                        .build())
                .toList();
    }
}
