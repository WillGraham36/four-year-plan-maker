package com.willgraham.four_year_planner.repository;

import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.model.UserCourse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserCourseRepository extends JpaRepository<UserCourse, Long> {
    boolean existsByUserIdAndCourseIdAndSemester(String userId, String courseId, Semester semester);

    List<UserCourse> findByUserIdAndCourseIdOrderBySemesterDesc(String userId, String courseId);

    List<UserCourse> findByUserIdAndCourse_CourseIdOrderBySemesterDesc(String userId, String courseId);

    List<UserCourse> findByUserId(String userId);
}
