package com.willgraham.four_year_planner.service;

import com.willgraham.four_year_planner.dto.CourseAutocompleteDto;
import com.willgraham.four_year_planner.dto.UmdIoCourseDto;
import com.willgraham.four_year_planner.model.Course;
import com.willgraham.four_year_planner.repository.CourseRepository;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class CourseServiceTest {
    private final CourseRepository courseRepository = mock(CourseRepository.class);
    private final UmdIoCourseClient umdIoCourseClient = mock(UmdIoCourseClient.class);
    private final CourseService courseService = new CourseService(courseRepository, umdIoCourseClient);

    @Test
    void autocompleteUsesOnlyLocalMatchesForPartialCourseQueries() {
        when(courseRepository.findCourseIdPrefixMatches(eq("CMSC1"), any(Pageable.class)))
                .thenReturn(List.of());

        List<CourseAutocompleteDto> result = courseService.autocomplete("cmsc1");

        assertEquals(0, result.size());
        verifyNoInteractions(umdIoCourseClient);
    }

    @Test
    void autocompleteFetchesAndSavesMissingExactCourseIds() {
        Course savedCourse = course("CMSC132", "Object-Oriented Programming II");
        Course honorsCourse = course("CMSC132H", "Object-Oriented Programming II Honors");
        UmdIoCourseDto fetchedCourse = new UmdIoCourseDto(
                "CMSC132",
                "Object-Oriented Programming II",
                "CMSC",
                4,
                List.of(List.of("NONE"))
        );

        when(courseRepository.findCourseIdPrefixMatches(eq("CMSC132"), any(Pageable.class)))
                .thenReturn(List.of(honorsCourse), List.of(savedCourse, honorsCourse));
        when(umdIoCourseClient.fetchCourse("CMSC132")).thenReturn(fetchedCourse);
        when(courseRepository.findByCourseIdIgnoreCase("CMSC132")).thenReturn(Optional.empty());
        when(courseRepository.saveAndFlush(any(Course.class))).thenAnswer(invocation -> invocation.getArgument(0, Course.class));

        List<CourseAutocompleteDto> result = courseService.autocomplete("cmsc132");

        assertEquals(2, result.size());
        assertEquals("CMSC132", result.getFirst().getCourseId());
        verify(umdIoCourseClient).fetchCourse("CMSC132");
    }

    @Test
    void autocompleteDoesNotFetchWhenExactCourseExistsLocally() {
        when(courseRepository.findCourseIdPrefixMatches(eq("CMSC132H"), any(Pageable.class)))
                .thenReturn(List.of(course("CMSC132H", "Object-Oriented Programming II Honors")));

        List<CourseAutocompleteDto> result = courseService.autocomplete("cmsc132h");

        assertEquals(1, result.size());
        assertEquals("CMSC132H", result.getFirst().getCourseId());
        verifyNoInteractions(umdIoCourseClient);
    }

    @Test
    void autocompleteReturnsCourseWhenConcurrentRequestAlreadyInsertedIt() {
        Course savedCourse = course("BIOE120", "Biology for Engineers");
        UmdIoCourseDto fetchedCourse = new UmdIoCourseDto(
                "BIOE120",
                "Biology for Engineers",
                "BIOE",
                3,
                List.of(List.of("DSNL"))
        );

        when(courseRepository.findCourseIdPrefixMatches(eq("BIOE120"), any(Pageable.class)))
                .thenReturn(List.of(), List.of(savedCourse));
        when(umdIoCourseClient.fetchCourse("BIOE120")).thenReturn(fetchedCourse);
        when(courseRepository.findByCourseIdIgnoreCase("BIOE120"))
                .thenReturn(Optional.empty(), Optional.of(savedCourse));
        when(courseRepository.saveAndFlush(any(Course.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate course"))
                .thenAnswer(invocation -> invocation.getArgument(0, Course.class));

        List<CourseAutocompleteDto> result = courseService.autocomplete("bioe120");

        assertEquals(1, result.size());
        assertEquals("BIOE120", result.getFirst().getCourseId());
    }

    private Course course(String courseId, String name) {
        Course course = new Course();
        course.setCourseId(courseId);
        course.setName(name);
        course.setDeptId(courseId.substring(0, 4));
        course.setCredits(4);
        course.setGenEds(List.of(List.of("NONE")));
        return course;
    }
}
