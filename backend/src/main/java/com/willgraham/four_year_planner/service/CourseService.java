package com.willgraham.four_year_planner.service;

import com.willgraham.four_year_planner.exception.CourseNotFoundException;
import com.willgraham.four_year_planner.exception.CourseServiceException;
import com.willgraham.four_year_planner.model.Course;
import com.willgraham.four_year_planner.repository.CourseRepository;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.Optional;

@AllArgsConstructor
@Service
public class CourseService {

    private final CourseRepository courseRepository;

    public Course findById(String courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> new CourseNotFoundException("Could not find course with ID: " + courseId));
    }

    public Course findOrCreateCourse(Course course) {
        return courseRepository.findById(course.getCourseId())
                .orElseGet(() -> courseRepository.save(course));
    }

}
