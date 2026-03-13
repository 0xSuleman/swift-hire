package com.swifthire.dictionary.repository;

import com.swifthire.dictionary.model.KnownSkillsDictionary;
import com.swifthire.dictionary.model.KnownSkillsDictionary.SkillCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface KnownSkillsDictionaryRepository extends JpaRepository<KnownSkillsDictionary, Long> {
    List<KnownSkillsDictionary> findByCategory(SkillCategory category);
    Optional<KnownSkillsDictionary> findBySkillNameIgnoreCase(String skillName);
    List<KnownSkillsDictionary> findBySkillNameIn(List<String> skillNames);
}
