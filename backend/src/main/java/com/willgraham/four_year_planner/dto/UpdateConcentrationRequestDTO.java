package com.willgraham.four_year_planner.dto;

import com.willgraham.four_year_planner.model.ULConcentrationAreas;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UpdateConcentrationRequestDTO {
    private ULConcentrationAreas concentration;
}
