package com.willgraham.four_year_planner.service.chat;

import com.willgraham.four_year_planner.dto.GetUserInfoResponseDto;
import com.willgraham.four_year_planner.dto.chat.PlannerChatIntentDto;
import com.willgraham.four_year_planner.dto.chat.PlannerChatIntentType;
import com.willgraham.four_year_planner.dto.chat.PlannerChatRetrievalDto;
import com.willgraham.four_year_planner.model.CurriculumProgramRequirement;
import com.willgraham.four_year_planner.model.CurriculumProgramType;
import com.willgraham.four_year_planner.model.CurriculumRequirementStatus;
import com.willgraham.four_year_planner.repository.CourseRepository;
import com.willgraham.four_year_planner.repository.CurriculumProgramRequirementRepository;
import com.willgraham.four_year_planner.service.CourseService;
import com.willgraham.four_year_planner.service.GenEdService;
import com.willgraham.four_year_planner.service.UserCourseService;
import com.willgraham.four_year_planner.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PlannerChatRetrievalServiceTest {
    private CourseService courseService;
    private CourseRepository courseRepository;
    private UserCourseService userCourseService;
    private UserService userService;
    private GenEdService genEdService;
    private CurriculumProgramRequirementRepository requirementRepository;
    private PlannerChatRetrievalService retrievalService;

    @BeforeEach
    void setUp() {
        courseService = mock(CourseService.class);
        courseRepository = mock(CourseRepository.class);
        userCourseService = mock(UserCourseService.class);
        userService = mock(UserService.class);
        genEdService = mock(GenEdService.class);
        requirementRepository = mock(CurriculumProgramRequirementRepository.class);
        retrievalService = new PlannerChatRetrievalService(
                courseService,
                courseRepository,
                userCourseService,
                userService,
                genEdService,
                requirementRepository
        );
    }

    @Test
    void retrievesSavedNonApprovedRequirementsForUserMajor() {
        GetUserInfoResponseDto userInfo = new GetUserInfoResponseDto();
        userInfo.setMajor("Computer Science");
        when(userService.getUserInfo("user-1")).thenReturn(userInfo);
        when(userCourseService.getAllCoursesForUser("user-1")).thenReturn(Map.of());
        when(genEdService.recalculateAndGetRequirements("user-1")).thenReturn(List.of());

        CurriculumProgramRequirement savedRequirement = new CurriculumProgramRequirement();
        savedRequirement.setId(42L);
        savedRequirement.setProgramName("Computer Science");
        savedRequirement.setCatalogTitle("Computer Science Major");
        savedRequirement.setProgramType(CurriculumProgramType.MAJOR);
        savedRequirement.setStatus(CurriculumRequirementStatus.DRAFT);
        savedRequirement.setCatalogYear("2025-2026");
        savedRequirement.setSourceUrl("https://example.test/cs");
        savedRequirement.setRawRequirementsText("Computer Science major requirements.");
        savedRequirement.setStructuredRequirementsJson("{\"requiredCourses\":[\"CMSC131\",\"CMSC132\"]}");

        when(requirementRepository.searchByStatus(
                eq("Computer Science"),
                eq(CurriculumRequirementStatus.APPROVED),
                any(Pageable.class)
        )).thenReturn(List.of());
        when(requirementRepository.searchByStatusNot(
                eq("Computer Science"),
                eq(CurriculumRequirementStatus.APPROVED),
                any(Pageable.class)
        )).thenReturn(List.of(savedRequirement));

        PlannerChatIntentDto intent = new PlannerChatIntentDto(
                PlannerChatIntentType.PLANNING_QUESTION,
                "",
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                8
        );

        PlannerChatRetrievalDto retrieved = retrievalService.retrieve("user-1", intent);

        assertEquals(1, retrieved.requirements().size());
        assertEquals(CurriculumRequirementStatus.DRAFT, retrieved.requirements().getFirst().status());
        assertTrue(retrieved.requirements().getFirst().structuredRequirementsExcerpt().contains("CMSC131"));
        assertTrue(retrieved.notes().stream().anyMatch(note -> note.contains("not approved")));
        verify(requirementRepository).searchByStatusNot(
                eq("Computer Science"),
                eq(CurriculumRequirementStatus.APPROVED),
                any(Pageable.class)
        );
    }
}
