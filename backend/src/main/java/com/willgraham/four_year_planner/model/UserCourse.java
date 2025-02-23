package com.willgraham.four_year_planner.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "user_courses")
public class UserCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private String userId;  // Only store the userId

    @ManyToOne
    @JoinColumn(name = "course_id", insertable = false, updatable = false)
    private Course course;  // Use the full Course object for JPA, but only store courseId

    @Column(name = "course_id")
    private String courseId;  // Only store the courseId

    @Embedded
    private Semester semester;
}
