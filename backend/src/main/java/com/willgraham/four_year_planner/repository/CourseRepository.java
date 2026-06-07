package com.willgraham.four_year_planner.repository;

import com.willgraham.four_year_planner.model.Course;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, String> {
    Optional<Course> findByCourseIdIgnoreCase(String courseId);

    @Query("""
        SELECT c FROM Course c
        WHERE c.courseId LIKE CONCAT(:query, '%')
        ORDER BY c.courseId ASC    
        """)
    List<Course> findCourseIdPrefixMatches(String query, Pageable pageable);

}
