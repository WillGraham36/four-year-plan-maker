package com.willgraham.four_year_planner.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DeleteWithUpdatesResponseDto {
    private int deletedCount;
    private List<GenEdDto> updatedGenEds;
    private ULConcentrationDTO updatedULConcentration;
}