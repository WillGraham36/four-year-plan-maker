package com.willgraham.four_year_planner.repository;

import com.willgraham.four_year_planner.model.Course;
import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.model.Term;
import com.willgraham.four_year_planner.model.UserCourse;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserCourseRepository extends JpaRepository<UserCourse, Long> {
    boolean existsByUserIdAndCourseIdAndSemester(String userId, String courseId, Semester semester);

    UserCourse findByUserIdAndCourseIdAndSemester(String userId, String courseId, Semester semester);

    List<UserCourse> findByUserIdAndCourseIdOrderBySemesterDesc(String userId, String courseId);

    List<UserCourse> findByUserIdAndCourse_CourseIdOrderBySemesterDesc(String userId, String courseId);

    List<UserCourse> findByUserId(String userId);

    @Query("""
        SELECT uc
        FROM UserCourse uc
        LEFT JOIN FETCH uc.course c
        WHERE uc.userId = :userId
        ORDER BY
            uc.semester.year ASC,
            CASE
                WHEN uc.semester.term = 'TRANSFER' THEN 0
                WHEN uc.semester.term = 'SPRING' THEN 1
                WHEN uc.semester.term = 'SUMMER' THEN 2
                WHEN uc.semester.term = 'FALL' THEN 3
                WHEN uc.semester.term = 'WINTER' THEN 4
                ELSE 5
            END ASC,
            COALESCE(uc.index, 2147483647) ASC,
            uc.id ASC
        """)
    List<UserCourse> findByUserIdWithCoursesOrdered(@Param("userId") String userId);

    @Query("""
        SELECT uc
        FROM UserCourse uc
        WHERE uc.userId = :userId
        ORDER BY
            uc.semester.year ASC,
            CASE
                WHEN uc.semester.term = 'TRANSFER' THEN 0
                WHEN uc.semester.term = 'SPRING' THEN 1
                WHEN uc.semester.term = 'SUMMER' THEN 2
                WHEN uc.semester.term = 'FALL' THEN 3
                WHEN uc.semester.term = 'WINTER' THEN 4
                ELSE 5
            END ASC,
            COALESCE(uc.index, 2147483647) ASC,
            uc.id ASC
        """)
    List<UserCourse> findByUserIdOrdered(@Param("userId") String userId);

    UserCourse findByUserIdAndCourse_CourseId(String userId, String courseId);

    // Get courses that satisfy a certain UL concentration prefix ("ENES", "CMSC" ...)
    @Query("""
        SELECT uc
        FROM UserCourse uc
        JOIN FETCH uc.course c
        WHERE uc.userId = :userId
        AND uc.courseId LIKE CONCAT(:concentrationIdPrefix, '%')
        ORDER BY
            uc.semester.year ASC,
            CASE
                WHEN uc.semester.term = 'TRANSFER' THEN 0
                WHEN uc.semester.term = 'SPRING' THEN 1
                WHEN uc.semester.term = 'SUMMER' THEN 2
                WHEN uc.semester.term = 'FALL' THEN 3
                WHEN uc.semester.term = 'WINTER' THEN 4
                ELSE 5
            END ASC,
            COALESCE(uc.index, 2147483647) ASC,
            uc.id ASC
        """)
    List<UserCourse> findULCoursesByUserIdAndConcentration(
            @Param("userId") String userId,
            @Param("concentrationIdPrefix") String concentrationIdPrefix
    );

    @Query("""
        SELECT uc
        FROM UserCourse uc
        JOIN FETCH uc.course c
        WHERE uc.userId = :userId
        AND uc.customUlConcentration = true
        ORDER BY
            uc.semester.year ASC,
            CASE
                WHEN uc.semester.term = 'TRANSFER' THEN 0
                WHEN uc.semester.term = 'SPRING' THEN 1
                WHEN uc.semester.term = 'SUMMER' THEN 2
                WHEN uc.semester.term = 'FALL' THEN 3
                WHEN uc.semester.term = 'WINTER' THEN 4
                ELSE 5
            END ASC,
            COALESCE(uc.index, 2147483647) ASC,
            uc.id ASC
        """)
    List<UserCourse> findCustomULCoursesByUserId(@Param("userId") String userId);

    @Modifying
    @Transactional
    int deleteByUserIdAndCourseIdAndSemester(String userId, String courseId, Semester semester);

    List<Course> findCoursesByUserId(String userId);

    @Query("""
        SELECT uc
        FROM UserCourse uc
        WHERE uc.userId = :userId
        AND (
            uc.semester.term = 'TRANSFER'
            OR uc.transferCreditName IS NOT NULL
        )
        ORDER BY COALESCE(uc.index, 2147483647) ASC, uc.id ASC
        """)
    List<UserCourse> findTransferCreditsByUserId(@Param("userId") String userId);

    @Modifying
    @Transactional
    void deleteByUserIdAndSemester_TermAndSemester_Year(String userId, Term term, Integer year);
}
