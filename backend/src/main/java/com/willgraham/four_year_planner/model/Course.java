package com.willgraham.four_year_planner.model;

import com.willgraham.four_year_planner.utils.ListOfListStringConverter;
import jakarta.persistence.*;
import lombok.Data;

import java.util.List;
import java.util.Objects;

@Data
@Entity
@Table(name = "courses")
public class Course {
    @Id
    private String courseId; // ex: "MATH140"
    private String name;
    private Integer credits;

    @Convert(converter = ListOfListStringConverter.class)
    @Column(columnDefinition = "TEXT") // Ensure enough space for JSON storage
    private List<List<String>> genEds;
}
