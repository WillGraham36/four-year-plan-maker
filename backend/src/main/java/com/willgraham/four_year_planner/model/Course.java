package com.willgraham.four_year_planner.model;

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
    private String department; //ex: "Mathmatics"
    private String name;
    private Integer credits;
    private List<String> genEds;
//    private List<String> preReqs;
}
