package com.willgraham.four_year_planner.model;

import com.willgraham.four_year_planner.utils.ListOfListStringConverter;
import jakarta.persistence.*;
import lombok.Data;

import java.util.List;
import java.util.Optional;

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

    private List<String> selectedGenEds;


    @Column(name = "transfer_credit_name")
    private String transferCreditName;

    @Convert(converter = ListOfListStringConverter.class)
    @Column(columnDefinition = "TEXT") // Ensure enough space for JSON storage
    private List<List<String>> transferGenEdsOverride;

    private Integer index;
}
