package com.swifthire.candidate.service;

import com.swifthire.dictionary.model.KnownSkillsDictionary;
import com.swifthire.dictionary.repository.KnownSkillsDictionaryRepository;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * BE2 — CV Parser (UC-09)
 * Uses Apache PDFBox to extract raw text, then scans against
 * KnownSkillsDictionary to extract skills. (NFR 3.1.2: ≤5s for ≤5MB)
 */
@Service
@RequiredArgsConstructor
public class CvParserService {

    private final KnownSkillsDictionaryRepository dictionaryRepository;

    public String extractTextFromPdf(MultipartFile file) throws IOException {
        try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        }
    }

    /**
     * Scans extracted CV text against KnownSkillsDictionary.
     * Returns comma-separated matched skill names (lowercase).
     */
    public String parseSkills(String rawText) {
        String textLower = rawText.toLowerCase();

        List<KnownSkillsDictionary> allSkills = dictionaryRepository
                .findByCategory(KnownSkillsDictionary.SkillCategory.SKILL);

        Set<String> matched = allSkills.stream()
                .filter(entry -> {
                    String skill = entry.getSkillName().toLowerCase();
                    // Use find() not matches() — matches() requires the ENTIRE string to match,
                    // which fails on multi-line PDF text since . doesn't match \n by default.
                    return Pattern.compile(
                            "\\b" + Pattern.quote(skill) + "\\b",
                            Pattern.CASE_INSENSITIVE
                    ).matcher(textLower).find();
                })
                .map(KnownSkillsDictionary::getSkillName)
                .collect(Collectors.toSet());

        return String.join(",", matched);
    }

    public void validatePdf(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw new IllegalArgumentException("Please add a PDF file.");
        }
        // NFR 3.4.1: max 10 MB enforced by Spring multipart config, but double-check
        if (file.getSize() > 10L * 1024 * 1024) {
            throw new IllegalArgumentException("File size exceeds the allowed limit (10 MB).");
        }
    }
}
