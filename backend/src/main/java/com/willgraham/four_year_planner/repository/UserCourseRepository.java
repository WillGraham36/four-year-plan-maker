package com.willgraham.four_year_planner.repository;

import com.willgraham.four_year_planner.dto.CourseIdentifierDto;
import com.willgraham.four_year_planner.dto.GenEdCourseInfoDto;
import com.willgraham.four_year_planner.model.Course;
import com.willgraham.four_year_planner.model.GenEd;
import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.model.UserCourse;
import com.willgraham.four_year_planner.projection.GenEdProjection;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;

public interface UserCourseRepository extends JpaRepository<UserCourse, Long> {
    boolean existsByUserIdAndCourseIdAndSemester(String userId, String courseId, Semester semester);

    List<UserCourse> findByUserIdAndCourseIdOrderBySemesterDesc(String userId, String courseId);

    List<UserCourse> findByUserIdAndCourse_CourseIdOrderBySemesterDesc(String userId, String courseId);

    List<UserCourse> findByUserId(String userId);

    List<UserCourse> findByUserIdOrderBySemesterAsc(String userId);

    @Modifying
    @Transactional
    int deleteByUserIdAndCourseIdAndSemester(String userId, String courseId, Semester semester);

    List<Course> findCoursesByUserId(String userId);

//    @Query("SELECT new com.willgraham.four_year_planner.dto.GenEdCourseInfoDto(" +
//            "c.genEds, c.courseId, uc.semester) " +
//            "FROM UserCourse uc " +
//            "JOIN Course c ON uc.courseId = c.courseId " +
//            "WHERE uc.userId = :userId " +
//            "AND c.genEds IS NOT NULL " +
//            "AND SIZE(c.genEds) > 0")
//    List<GenEdCourseInfoDto> findGenEdsByUserId(@Param("userId") String userId);
    @Query(value = "SELECT c.gen_eds as genEds, c.course_id as courseId, " +
            "uc.term, uc.year " +
            "FROM user_courses uc " +
            "JOIN courses c ON uc.course_id = c.course_id " +
            "WHERE uc.user_id = :userId " +
            "AND c.gen_eds != '[[]]' " +
            "AND c.gen_eds IS NOT NULL",
            nativeQuery = true)
    List<GenEdProjection> findGenEdsByUserIdNative(@Param("userId") String userId);
}
