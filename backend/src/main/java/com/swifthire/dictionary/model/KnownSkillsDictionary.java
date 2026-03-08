package com.swifthire.dictionary.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "known_skills_dictionary")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class KnownSkillsDictionary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String skillName;  // stored lowercase for matching

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SkillCategory category;

    public enum SkillCategory {
        SKILL,      // e.g., java, react, spring boot
        LOCATION,   // e.g., lahore, karachi, islamabad
        SHIFT       // e.g., day, night, remote
    }
}
