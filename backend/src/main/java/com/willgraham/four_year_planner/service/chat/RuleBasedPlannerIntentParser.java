package com.willgraham.four_year_planner.service.chat;

import com.willgraham.four_year_planner.dto.chat.PlannerChatIntentDto;
import com.willgraham.four_year_planner.dto.chat.PlannerChatIntentType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.regex.MatchResult;
import java.util.regex.Pattern;

@Component
public class RuleBasedPlannerIntentParser {
    private static final Pattern COURSE_ID = Pattern.compile("\\b([A-Za-z]{4})\\s*-?\\s*([0-9]{3}[A-Za-z]{0,2})\\b");
    private static final Pattern DEPARTMENT = Pattern.compile("\\b[A-Za-z]{4}\\b");
    private static final Pattern GEN_ED = Pattern.compile("\\b(FSAW|FSPW|FSMA|FSOC|FSAR|DSNL|DSNS|DSHS|DSHU|DSSP|SCIS|DVUP|DVCC)\\b", Pattern.CASE_INSENSITIVE);

    public PlannerChatIntentDto parse(String message) {
        String normalized = message == null ? "" : message.toLowerCase(Locale.ROOT);
        PlannerChatIntentType intent = resolveIntent(normalized);

        List<String> courseIds = COURSE_ID.matcher(message == null ? "" : message)
                .results()
                .map(match -> (match.group(1) + match.group(2)).toUpperCase(Locale.ROOT))
                .distinct()
                .toList();
        List<String> genEds = GEN_ED.matcher(message == null ? "" : message)
                .results()
                .map(MatchResult::group)
                .map(value -> value.toUpperCase(Locale.ROOT))
                .distinct()
                .toList();
        List<String> departments = courseIds.isEmpty()
                ? DEPARTMENT.matcher(message == null ? "" : message)
                        .results()
                        .map(MatchResult::group)
                        .map(value -> value.toUpperCase(Locale.ROOT))
                        .distinct()
                        .toList()
                : List.of();

        return new PlannerChatIntentDto(
                intent,
                message,
                courseIds,
                departments,
                genEds,
                List.of(message == null ? "" : message),
                List.of(),
                8
        );
    }

    private PlannerChatIntentType resolveIntent(String normalized) {
        if (normalized.contains("remaining") || normalized.contains("left") || normalized.contains("still need")) {
            return PlannerChatIntentType.EXPLAIN_REMAINING_REQUIREMENTS;
        }
        if (normalized.contains("progress") || normalized.contains("degree audit") || normalized.contains("on track")) {
            return PlannerChatIntentType.DEGREE_PROGRESS;
        }
        if (normalized.contains("satisfy") || normalized.contains("requirement") || normalized.contains("gen ed")) {
            return PlannerChatIntentType.REQUIREMENT_COURSES;
        }
        if (normalized.contains("recommend") || normalized.contains("suggest") || normalized.contains("take next")) {
            return PlannerChatIntentType.RECOMMEND_COURSES;
        }
        if (normalized.contains("search") || normalized.contains("find") || COURSE_ID.matcher(normalized).find()) {
            return PlannerChatIntentType.SEARCH_COURSES;
        }
        return PlannerChatIntentType.PLANNING_QUESTION;
    }
}
