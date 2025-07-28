package com.willgraham.four_year_planner.repository;

import com.willgraham.four_year_planner.model.Course;
import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.model.Term;
import com.willgraham.four_year_planner.model.UserCourse;
import com.willgraham.four_year_planner.projection.CourseProjection;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserCourseRepository extends JpaRepository<UserCourse, Long> {
    boolean existsByUserIdAndCourseIdAndSemester(String userId, String courseId, Semester semester);

    List<UserCourse> findByUserIdAndCourseIdOrderBySemesterDesc(String userId, String courseId);

    List<UserCourse> findByUserIdAndCourse_CourseIdOrderBySemesterDesc(String userId, String courseId);

    List<UserCourse> findByUserId(String userId);

    List<UserCourse> findByUserIdOrderBySemesterAsc(String userId);

    UserCourse findByUserIdAndCourse_CourseId(String userId, String courseId);

    // Get courses that satisfy a certain UL concentration prefix ("ENES", "CMSC" ...)
    List<UserCourse> findByUserIdAndCourseIdStartingWith(String userId, String concentrationIdPrefix);

    @Modifying
    @Transactional
    @Query("UPDATE UserCourse uc SET uc.selectedGenEds = :selectedGenEds " +
            "WHERE uc.userId = :userId AND uc.course.courseId = :courseId")
    int updateSelectedGenEdsByUserIdAndCourseId(@Param("selectedGenEds") List<String> selectedGenEds,
                                                @Param("userId") String userId,
                                                @Param("courseId") String courseId);

    @Modifying
    @Transactional
    int deleteByUserIdAndCourseIdAndSemester(String userId, String courseId, Semester semester);

    List<Course> findCoursesByUserId(String userId);

    @Query(value = "SELECT c.gen_eds as genEds, c.course_id as courseId, " +
            "uc.term, uc.year, uc.selected_gen_eds as selectedGenEds, uc.transfer_gen_eds_override as genEdOverrides, uc.transfer_credit_name as transferCreditName " +
            "FROM user_courses uc " +
            "JOIN courses c ON uc.course_id = c.course_id " +
            "WHERE uc.user_id = :userId ",
            nativeQuery = true)
    List<CourseProjection> findAllCoursesWithInfoByUser(@Param("userId") String userId);


    @Query("""
        SELECT uc
        FROM UserCourse uc
        WHERE uc.userId = :userId
        AND (
            uc.semester.term = 'TRANSFER'
            OR uc.transferCreditName IS NOT NULL
        )
        """)
    List<UserCourse> findTransferCreditsByUserId(@Param("userId") String userId);

    @Modifying
    @Transactional
    void deleteByUserIdAndSemester_TermAndSemester_Year(String userId, Term term, Integer year);
}
