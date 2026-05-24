package com.willgraham.four_year_planner.service;

import com.willgraham.four_year_planner.exception.CourseNotFoundException;
import com.willgraham.four_year_planner.dto.CourseAutocompleteDto;
import com.willgraham.four_year_planner.dto.CourseSyncResponseDto;
import com.willgraham.four_year_planner.dto.UmdIoCourseDto;
import com.willgraham.four_year_planner.model.Course;
import com.willgraham.four_year_planner.repository.CourseRepository;
import com.willgraham.four_year_planner.utils.DepartmentCodes;

import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@AllArgsConstructor
@Service
public class CourseService {
    private static final int AUTOCOMPLETE_LIMIT = 10;
    private static final Pattern NORMALIZED_COURSE_QUERY = Pattern.compile("^[A-Z]{4}[0-9A-Z]*$");
    private static final Pattern COMPLETE_COURSE_ID = Pattern.compile("^[A-Z]{4}[0-9]{3}[A-Z]{0,2}$");

    private final CourseRepository courseRepository;
    private final UmdIoCourseClient umdIoCourseClient;

    public Course findById(String courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> new CourseNotFoundException("Could not find course with ID: " + courseId));
    }

    public Course findOrCreateCourse(Course course) {
        String normalizedCourseId = normalizeQuery(course.getCourseId());
        course.setCourseId(normalizedCourseId);
        course.setDeptId(deptIdFor(normalizedCourseId));

        return courseRepository.findByCourseIdIgnoreCase(normalizedCourseId)
                .map(existingCourse -> updateExistingCourse(existingCourse, course))
                .orElseGet(() -> courseRepository.save(course));
    }

    public List<CourseAutocompleteDto> autocomplete(String rawQuery) {
        String query = normalizeQuery(rawQuery);
        if (!isUsefulCourseQuery(query)) {
            return List.of();
        }

        String deptId = query.substring(0, 4);
        if (!DepartmentCodes.isKnown(deptId)) {
            return List.of();
        }

        List<Course> localMatches = searchLocal(query);
        if (localMatches.size() >= 3) {
            return toAutocompleteDtos(localMatches);
        }

        String suffix = query.substring(4);
        int digitCount = countDigits(suffix);
        boolean exactExistsLocally = COMPLETE_COURSE_ID.matcher(query).matches()
                && courseRepository.findByCourseIdIgnoreCase(query).isPresent();

        if ((digitCount >= 1 && digitCount <= 2 && localMatches.size() < 3)) {
            upsertCourses(umdIoCourseClient.fetchMinifiedDepartmentCourses(deptId));
            localMatches = searchLocal(query);
        } else if (digitCount >= 3 && !exactExistsLocally && COMPLETE_COURSE_ID.matcher(query).matches()) {
            UmdIoCourseDto course = umdIoCourseClient.fetchCourse(query);
            if (course != null) {
                upsertCourse(course);
                localMatches = searchLocal(query);
            }
        }

        return toAutocompleteDtos(localMatches);
    }

    public Course findOrFetchByCourseId(String rawCourseId) {
        String courseId = normalizeQuery(rawCourseId);
        if (!COMPLETE_COURSE_ID.matcher(courseId).matches() || !DepartmentCodes.isKnown(courseId.substring(0, 4))) {
            throw new CourseNotFoundException("Course not found");
        }

        Optional<Course> localCourse = courseRepository.findByCourseIdIgnoreCase(courseId);
        if (localCourse.isPresent() && hasFullCourseDetails(localCourse.get())) {
            return localCourse.get();
        }

        UmdIoCourseDto fetchedCourse = umdIoCourseClient.fetchCourse(courseId);
        if (fetchedCourse == null) {
            return localCourse.orElseThrow(() -> new CourseNotFoundException("Course not found"));
        }

        return upsertCourse(fetchedCourse);
    }

    public List<Course> findOrFetchByCourseIds(List<String> rawCourseIds) {
        return rawCourseIds.stream()
                .map(this::findOrFetchByCourseId)
                .toList();
    }

    public CourseSyncResponseDto syncDepartments(List<String> rawDepartments) {
        List<String> syncedDepartments = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int upsertedCount = 0;

        for (String rawDepartment : Optional.ofNullable(rawDepartments).orElse(List.of())) {
            String deptId = normalizeQuery(rawDepartment);
            if (!deptId.matches("^[A-Z]{4}$") || !DepartmentCodes.isKnown(deptId)) {
                errors.add(rawDepartment + ": invalid department");
                continue;
            }

            try {
                List<UmdIoCourseDto> departmentCourses = umdIoCourseClient.fetchFullDepartmentCourses(deptId);
                upsertedCount += upsertCourses(departmentCourses);
                syncedDepartments.add(deptId);
            } catch (RuntimeException e) {
                errors.add(deptId + ": " + e.getMessage());
            }
        }

        return new CourseSyncResponseDto(syncedDepartments, upsertedCount, errors);
    }

    private List<Course> searchLocal(String query) {
        return courseRepository.findCourseIdPrefixMatches(query, PageRequest.of(0, AUTOCOMPLETE_LIMIT));
    }

    private List<CourseAutocompleteDto> toAutocompleteDtos(List<Course> courses) {
        return courses.stream()
                .limit(AUTOCOMPLETE_LIMIT)
                .map(CourseAutocompleteDto::fromCourse)
                .toList();
    }

    private int upsertCourses(List<UmdIoCourseDto> umdIoCourses) {
        Map<String, UmdIoCourseDto> uniqueCourses = new LinkedHashMap<>();
        for (UmdIoCourseDto course : umdIoCourses) {
            if (course.courseId() != null && course.courseId().length() >= 4) {
                uniqueCourses.put(course.courseId(), course);
            }
        }

        List<Course> courses = uniqueCourses.values().stream()
                .map(this::mergeCourse)
                .toList();
        courseRepository.saveAll(courses);
        return courses.size();
    }

    private Course upsertCourse(UmdIoCourseDto umdIoCourse) {
        Course course = mergeCourse(umdIoCourse);
        return courseRepository.save(course);
    }

    private Course mergeCourse(UmdIoCourseDto umdIoCourse) {
        Course course = courseRepository.findByCourseIdIgnoreCase(umdIoCourse.courseId())
                .orElseGet(Course::new);

        course.setCourseId(umdIoCourse.courseId());
        course.setDeptId(umdIoCourse.deptId() != null ? umdIoCourse.deptId() : deptIdFor(umdIoCourse.courseId()));
        if (umdIoCourse.name() != null && !umdIoCourse.name().isBlank()) {
            course.setName(umdIoCourse.name());
        }
        if (umdIoCourse.credits() != null) {
            course.setCredits(umdIoCourse.credits());
        }
        if (umdIoCourse.genEds() != null) {
            course.setGenEds(umdIoCourse.genEds());
        }
        if (umdIoCourse.description() != null) {
            course.setDescription(umdIoCourse.description());
        }
        course.setLastSyncedAt(Instant.now());

        return course;
    }

    private Course updateExistingCourse(Course existingCourse, Course incomingCourse) {
        if (incomingCourse.getName() != null && !incomingCourse.getName().isBlank()) {
            existingCourse.setName(incomingCourse.getName());
        }
        if (incomingCourse.getDeptId() != null && !incomingCourse.getDeptId().isBlank()) {
            existingCourse.setDeptId(incomingCourse.getDeptId());
        }
        if (incomingCourse.getCredits() != null) {
            existingCourse.setCredits(incomingCourse.getCredits());
        }
        if (incomingCourse.getGenEds() != null) {
            existingCourse.setGenEds(incomingCourse.getGenEds());
        }
        if (incomingCourse.getDescription() != null) {
            existingCourse.setDescription(incomingCourse.getDescription());
        }

        return courseRepository.save(existingCourse);
    }

    private boolean hasFullCourseDetails(Course course) {
        return course.getName() != null
                && !course.getName().isBlank()
                && course.getCredits() != null
                && course.getGenEds() != null;
    }

    private boolean isUsefulCourseQuery(String query) {
        return query.length() >= 4 && NORMALIZED_COURSE_QUERY.matcher(query).matches();
    }

    private int countDigits(String value) {
        return (int) value.chars().filter(Character::isDigit).count();
    }

    private String deptIdFor(String courseId) {
        return courseId != null && courseId.length() >= 4 ? courseId.substring(0, 4) : null;
    }

    private String normalizeQuery(String value) {
        return value == null ? "" : value.toUpperCase().replaceAll("[\\s-]", "");
    }
}
