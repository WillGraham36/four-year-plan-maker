package com.willgraham.four_year_planner.service.chat;

import com.willgraham.four_year_planner.dto.chat.PlannerChatCourseDto;
import com.willgraham.four_year_planner.dto.chat.PlannerChatGenEdRequirementDto;
import com.willgraham.four_year_planner.dto.chat.PlannerChatIntentDto;
import com.willgraham.four_year_planner.dto.chat.PlannerChatRequirementDto;
import com.willgraham.four_year_planner.dto.chat.PlannerChatRetrievalDto;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class PlannerChatFallbackResponseService {
    public String generate(PlannerChatIntentDto intent, PlannerChatRetrievalDto retrievedData, boolean aiConfigured) {
        if (!aiConfigured) {
            return "AI chat is not configured yet because OPENAI_API_KEY is blank. I still retrieved verified planner data: "
                    + summarize(retrievedData);
        }

        return "I could not complete the AI response, but I retrieved verified planner data: " + summarize(retrievedData);
    }

    private String summarize(PlannerChatRetrievalDto retrievedData) {
        String courses = retrievedData.courses().stream()
                .map(this::formatCourse)
                .limit(5)
                .collect(Collectors.joining("; "));
        String requirements = retrievedData.requirements().stream()
                .map(PlannerChatRequirementDto::catalogTitle)
                .limit(3)
                .collect(Collectors.joining("; "));
        long remainingGenEds = retrievedData.genEdRequirements().stream()
                .filter(requirement -> !requirement.satisfied())
                .count();

        return "credits "
                + retrievedData.progress().totalCredits()
                + "/"
                + retrievedData.progress().requiredCredits()
                + ", remaining GenEds "
                + remainingGenEds
                + ", courses ["
                + emptyFallback(courses)
                + "], requirements ["
                + emptyFallback(requirements)
                + "].";
    }

    private String formatCourse(PlannerChatCourseDto course) {
        return course.courseId() + (course.name() == null || course.name().isBlank() ? "" : " - " + course.name());
    }

    private String emptyFallback(String value) {
        return value == null || value.isBlank() ? "none found" : value;
    }
}
