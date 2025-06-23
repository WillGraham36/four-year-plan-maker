package com.willgraham.four_year_planner.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Entity
@Table(name = "users")
@AllArgsConstructor
@NoArgsConstructor
public class User {

    @Id
    private String id;

    @Column(name = "ul_concentration")
    private String ULConcentration;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "term", column = @Column(name = "start_term")),
            @AttributeOverride(name = "year", column = @Column(name = "start_year"))
    })
    private Semester startSemester;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "term", column = @Column(name = "end_term")),
            @AttributeOverride(name = "year", column = @Column(name = "end_year"))
    })
    @Column(name = "end_semester")
    private Semester endSemester;
    private String major;
    private String minor;

    public User(String id, Semester startSemester, Semester endSemester, String major, String minor) {
        this.id = id;
        this.startSemester = startSemester;
        this.endSemester = endSemester;
        this.major = major;
        this.minor = minor;
    }
}
