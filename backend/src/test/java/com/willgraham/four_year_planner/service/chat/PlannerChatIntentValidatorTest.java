package com.willgraham.four_year_planner.service.chat;

import com.willgraham.four_year_planner.dto.chat.PlannerChatIntentDto;
import com.willgraham.four_year_planner.dto.chat.PlannerChatIntentType;
import com.willgraham.four_year_planner.exception.InvalidInputException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PlannerChatIntentValidatorTest {
    private final PlannerChatIntentValidator validator = new PlannerChatIntentValidator();

    @Test
    void normalizesAndCapsStructuredIntent() {
        PlannerChatIntentDto rawIntent = new PlannerChatIntentDto(
                PlannerChatIntentType.SEARCH_COURSES,
                "  Find CMSC courses  ",
                List.of("cmsc 131", "not-a-course", "MATH140"),
                List.of("cmsc", "fake"),
                List.of("dshu", "bad"),
                List.of("  upper level   electives  "),
                List.of(" Computer Science "),
                100
        );

        PlannerChatIntentDto validated = validator.validate(rawIntent, "Find CMSC courses");

        assertEquals(List.of("CMSC131", "MATH140"), validated.courseIds());
        assertEquals(List.of("CMSC"), validated.departments());
        assertEquals(List.of("DSHU"), validated.genEds());
        assertEquals(List.of("upper level electives"), validated.requirementKeywords());
        assertEquals(12, validated.limit());
    }

    @Test
    void rejectsBlankMessage() {
        PlannerChatIntentDto rawIntent = new PlannerChatIntentDto(
                PlannerChatIntentType.UNKNOWN,
                "",
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                8
        );

        assertThrows(InvalidInputException.class, () -> validator.validate(rawIntent, " "));
    }
}
