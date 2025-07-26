package com.willgraham.four_year_planner.dto;

import com.willgraham.four_year_planner.model.Term;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateOffTermRequestDto {
    private Term term;
    private int year;
}
