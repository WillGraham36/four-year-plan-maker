package com.willgraham.four_year_planner.dto;

import com.willgraham.four_year_planner.model.CsTrack;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateTrackDto {
    private CsTrack track;
}
