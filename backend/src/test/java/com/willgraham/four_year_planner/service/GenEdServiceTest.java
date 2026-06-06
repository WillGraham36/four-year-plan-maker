package com.willgraham.four_year_planner.service;

import com.willgraham.four_year_planner.dto.GenEdRequirementDto;
import com.willgraham.four_year_planner.model.Course;
import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.model.Term;
import com.willgraham.four_year_planner.model.UserCourse;
import com.willgraham.four_year_planner.repository.UserCourseRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GenEdServiceTest {

    private final UserCourseRepository userCourseRepository = mock(UserCourseRepository.class);
    private final EntityManager entityManager = mock(EntityManager.class);
    private final GenEdService genEdService =
            new GenEdService(userCourseRepository, new GenEdAssignmentService(), entityManager);

    @Test
    void getRequirementsWithCoursesCalculatesAssignmentsWithoutPersisting() {
        String userId = "user_123";
        UserCourse userCourse = userCourse(1L, "ENGL101", List.of(List.of("FSAW")));

        when(userCourseRepository.findByUserIdWithCoursesOrdered(userId)).thenReturn(List.of(userCourse));

        GenEdService.GenEdCalculationResult result = genEdService.getRequirementsWithCourses(userId);

        assertEquals(List.of("FSAW"), result.userCourses().getFirst().getSelectedGenEds());
        verify(entityManager).detach(userCourse);
        verify(userCourseRepository, never()).saveAll(any());
    }

    @Test
    void recalculateAndGetRequirementsPersistsChangedAssignments() {
        String userId = "user_123";
        UserCourse userCourse = userCourse(1L, "ENGL101", List.of(List.of("FSAW")));

        when(userCourseRepository.findByUserIdWithCoursesOrdered(userId)).thenReturn(List.of(userCourse));

        List<GenEdRequirementDto> result = genEdService.recalculateAndGetRequirements(userId);

        assertEquals("ENGL101", result.getFirst().getCourseId());
        verify(entityManager, never()).detach(userCourse);
        verify(userCourseRepository).saveAll(List.of(userCourse));
    }

    private UserCourse userCourse(Long id, String courseId, List<List<String>> genEds) {
        Course course = new Course();
        course.setCourseId(courseId);
        course.setName(courseId);
        course.setCredits(3);
        course.setGenEds(genEds);

        UserCourse userCourse = new UserCourse();
        userCourse.setId(id);
        userCourse.setUserId("user_123");
        userCourse.setCourseId(courseId);
        userCourse.setCourse(course);
        userCourse.setSemester(new Semester(Term.FALL, 2026));
        userCourse.setIndex(0);
        return userCourse;
    }
}
