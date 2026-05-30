package com.willgraham.four_year_planner.service.chat;

import com.willgraham.four_year_planner.dto.chat.PlannerChatIntentDto;
import com.willgraham.four_year_planner.dto.chat.PlannerChatIntentType;
import com.willgraham.four_year_planner.exception.InvalidInputException;
import com.willgraham.four_year_planner.utils.DepartmentCodes;
import org.springframework.stereotype.Component;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Component
public class PlannerChatIntentValidator {
    private static final int MAX_MESSAGE_LENGTH = 2000;
    private static final int MAX_LIST_VALUES = 12;
    private static final int MAX_LIMIT = 12;
    private static final Pattern COURSE_ID = Pattern.compile("^[A-Z]{4}[0-9]{3}[A-Z]{0,2}$");
    private static final Pattern DEPARTMENT = Pattern.compile("^[A-Z]{4}$");
    private static final Pattern GEN_ED = Pattern.compile("^[A-Z]{4}$");

    public PlannerChatIntentDto validate(PlannerChatIntentDto intent, String message) {
        if (message == null || message.isBlank()) {
            throw new InvalidInputException("Chat message is required");
        }
        if (message.length() > MAX_MESSAGE_LENGTH) {
            throw new InvalidInputException("Chat message cannot exceed " + MAX_MESSAGE_LENGTH + " characters");
        }

        PlannerChatIntentDto safeIntent = intent == null
                ? new PlannerChatIntentDto(PlannerChatIntentType.UNKNOWN, message, List.of(), List.of(), List.of(), List.of(), List.of(), 8)
                : intent;

        return new PlannerChatIntentDto(
                safeIntent.intent(),
                clampText(safeIntent.query(), 200),
                normalizeValues(safeIntent.courseIds(), COURSE_ID, true),
                normalizeDepartments(safeIntent.departments()),
                normalizeValues(safeIntent.genEds(), GEN_ED, true),
                normalizeFreeTextValues(safeIntent.requirementKeywords()),
                normalizeFreeTextValues(safeIntent.programNames()),
                clampLimit(safeIntent.limit())
        );
    }

    private List<String> normalizeDepartments(List<String> rawValues) {
        return normalizeValues(rawValues, DEPARTMENT, true).stream()
                .filter(DepartmentCodes::isKnown)
                .toList();
    }

    private List<String> normalizeValues(List<String> rawValues, Pattern pattern, boolean compact) {
        Set<String> normalized = new LinkedHashSet<>();
        for (String rawValue : rawValues == null ? List.<String>of() : rawValues) {
            String value = rawValue == null ? "" : rawValue.toUpperCase(Locale.ROOT).trim();
            if (compact) {
                value = value.replaceAll("[\\s-]", "");
            }
            if (pattern.matcher(value).matches()) {
                normalized.add(value);
            }
            if (normalized.size() >= MAX_LIST_VALUES) {
                break;
            }
        }
        return List.copyOf(normalized);
    }

    private List<String> normalizeFreeTextValues(List<String> rawValues) {
        Set<String> normalized = new LinkedHashSet<>();
        for (String rawValue : rawValues == null ? List.<String>of() : rawValues) {
            String value = clampText(rawValue, 80);
            if (!value.isBlank()) {
                normalized.add(value);
            }
            if (normalized.size() >= MAX_LIST_VALUES) {
                break;
            }
        }
        return List.copyOf(normalized);
    }

    private int clampLimit(Integer limit) {
        int value = limit == null ? 8 : limit;
        return Math.max(1, Math.min(value, MAX_LIMIT));
    }

    private String clampText(String value, int maxLength) {
        if (value == null) {
            return "";
        }
        String trimmed = value.replaceAll("\\s+", " ").trim();
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength);
    }
}
