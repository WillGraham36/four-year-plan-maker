package com.willgraham.four_year_planner.dto;

import com.willgraham.four_year_planner.model.ULConcentrationAreas;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.antlr.v4.runtime.misc.NotNull;

@Data
@AllArgsConstructor
public class UpdateConcentrationRequestDTO {
    @NotNull
    private ULConcentrationAreas concentration;
}
