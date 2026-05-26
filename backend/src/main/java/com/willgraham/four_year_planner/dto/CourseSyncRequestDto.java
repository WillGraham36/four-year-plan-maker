package com.willgraham.four_year_planner.dto;

import lombok.Data;

import java.util.List;

@Data
public class CourseSyncRequestDto {
    private List<String> departments;
}
