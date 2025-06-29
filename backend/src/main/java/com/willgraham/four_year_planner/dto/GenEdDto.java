package com.willgraham.four_year_planner.dto;

import com.willgraham.four_year_planner.model.Semester;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.List;
import java.util.Optional;
import java.util.Optional;

@Getter
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class GenEdDto {
    String genEd;
    String courseId;
    String semesterName;
    String transferCreditName = "";

    public GenEdDto(String genEd, String courseId, String semesterName) {
        this.genEd = genEd;
        this.courseId = courseId;
        this.semesterName = semesterName;
    }
}
