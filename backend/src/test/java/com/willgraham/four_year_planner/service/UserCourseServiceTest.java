package com.willgraham.four_year_planner.service;

import com.willgraham.four_year_planner.dto.ULConcentrationDTO;
import com.willgraham.four_year_planner.model.Course;
import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.model.Term;
import com.willgraham.four_year_planner.model.User;
import com.willgraham.four_year_planner.model.UserCourse;
import com.willgraham.four_year_planner.repository.UserCourseRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserCourseServiceTest {

    private final UserCourseRepository userCourseRepository = mock(UserCourseRepository.class);
    private final CourseService courseService = mock(CourseService.class);
    private final UserService userService = mock(UserService.class);
    private final UserCourseService userCourseService =
            new UserCourseService(userCourseRepository, courseService, userService);

    @Test
    void getULConcentrationAndCoursesHydratesCourseBeforeReadingCredits() {
        String userId = "user_123";
        User user = new User();
        user.setULConcentration("CMSC");

        UserCourse userCourse = new UserCourse();
        userCourse.setId(1L);
        userCourse.setUserId(userId);
        userCourse.setCourseId("CMSC330");
        userCourse.setSemester(new Semester(Term.FALL, 2025));
        userCourse.setIndex(0);

        Course course = new Course();
        course.setCourseId("CMSC330");
        course.setName("Organization of Programming Languages");
        course.setCredits(3);
        course.setGenEds(List.of(List.of("NONE")));

        when(userService.findById(userId)).thenReturn(user);
        when(userCourseRepository.findULCoursesByUserIdAndConcentration(userId, "CMSC"))
                .thenReturn(List.of(userCourse));
        when(courseService.findById("CMSC330")).thenReturn(course);

        ULConcentrationDTO result = userCourseService.getULConcentrationAndCourses(userId);

        assertEquals("CMSC", result.getConcentration());
        assertEquals(1, result.getCourses().size());
        assertEquals("CMSC330", result.getCourses().getFirst().getCourseId());
        assertEquals(3, result.getCourses().getFirst().getCredits());
    }

    @Test
    void getULConcentrationAndCoursesIncludesCustomNonPrefixCourses() {
        String userId = "user_123";
        User user = new User();
        user.setULConcentration("CMSC");

        Course customCourse = new Course();
        customCourse.setCourseId("MATH401");
        customCourse.setName("Applications of Linear Algebra");
        customCourse.setCredits(3);
        customCourse.setGenEds(List.of(List.of("NONE")));

        UserCourse customUserCourse = new UserCourse();
        customUserCourse.setId(1L);
        customUserCourse.setUserId(userId);
        customUserCourse.setCourseId("MATH401");
        customUserCourse.setCourse(customCourse);
        customUserCourse.setSemester(new Semester(Term.SPRING, 2026));
        customUserCourse.setCustomUlConcentration(true);

        when(userService.findById(userId)).thenReturn(user);
        when(userCourseRepository.findULCoursesByUserIdAndConcentration(userId, "CMSC"))
                .thenReturn(List.of());
        when(userCourseRepository.findCustomULCoursesByUserId(userId))
                .thenReturn(List.of(customUserCourse));

        ULConcentrationDTO result = userCourseService.getULConcentrationAndCourses(userId);

        assertEquals(1, result.getCourses().size());
        assertEquals("MATH401", result.getCourses().getFirst().getCourseId());
        assertTrue(result.getCourses().getFirst().isCustom());
    }
}
