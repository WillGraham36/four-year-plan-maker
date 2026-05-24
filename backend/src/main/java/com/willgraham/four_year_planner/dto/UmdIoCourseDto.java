package com.willgraham.four_year_planner.dto;

import java.util.List;

public record UmdIoCourseDto(
        String courseId,
        String name,
        String deptId,
        Integer credits,
        List<List<String>> genEds,
        String description
) {
}
