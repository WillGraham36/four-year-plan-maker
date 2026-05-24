package com.willgraham.four_year_planner.model;

import com.willgraham.four_year_planner.utils.ListOfListStringConverter;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Entity
@Table(
        name = "courses",
        indexes = {
                @Index(name = "idx_courses_course_id", columnList = "course_id"),
                @Index(name = "idx_courses_dept_id", columnList = "dept_id")
        }
)
public class Course {
    @Id
    private String courseId; // ex: "MATH140"
    private String name;
    private String deptId;
    private Integer credits;

    @Convert(converter = ListOfListStringConverter.class)
    @Column(columnDefinition = "TEXT") // Ensure enough space for JSON storage
    private List<List<String>> genEds;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Instant lastSyncedAt;
}
