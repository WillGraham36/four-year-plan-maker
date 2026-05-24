package com.willgraham.four_year_planner.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class CourseSyncResponseDto {
    private List<String> syncedDepartments;
    private int coursesInsertedOrUpdated;
    private List<String> errors;
}
