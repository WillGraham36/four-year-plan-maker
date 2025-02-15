package com.willgraham.four_year_planner.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

enum Term {
    SPRING,
    FALL,
    WINTER,
    SUMMER
}

@Data
@Embeddable
public class Semester {
    @Enumerated(EnumType.STRING)
    private Term term;

    private Integer year;
}
