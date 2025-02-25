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
public class Semester implements Comparable<Semester> {
    @Enumerated(EnumType.STRING)
    private Term term;

    private Integer year;

    @Override
    public int compareTo(Semester o) {
        // Compare by year first
        int yearComparison = this.year.compareTo(o.year);
        if (yearComparison != 0) {
            return yearComparison;
        }

        // Compare by term order
        return Integer.compare(getTermOrder(this.term), getTermOrder(o.term));
    }

    private int getTermOrder(Term term) {
        return switch (term) {
            case SPRING -> 1;
            case SUMMER -> 2;
            case FALL -> 3;
            case WINTER -> 4;
        };
    }
}
