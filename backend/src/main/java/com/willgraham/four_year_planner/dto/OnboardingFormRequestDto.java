package com.willgraham.four_year_planner.dto;

import com.willgraham.four_year_planner.model.Term;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OnboardingFormRequestDto {
    private Term startTerm;
    private int startYear;
    private Term endTerm;
    private int endYear;
    private String major;
    private String minor;
    private List<TransferCreditDto> transferCredits;
}
