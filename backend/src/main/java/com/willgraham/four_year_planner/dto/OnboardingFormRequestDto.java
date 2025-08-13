package com.willgraham.four_year_planner.dto;

import com.willgraham.four_year_planner.model.CsTrack;
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
    private CsTrack track;
    private String minor;
    private List<TransferCreditDto> transferCredits;

    public OnboardingFormRequestDto(String major, int endYear, Term endTerm, int startYear, Term startTerm, String minor, List<TransferCreditDto> transferCredits, CsTrack track) {
        this.major = major;
        this.endYear = endYear;
        this.endTerm = endTerm;
        this.startYear = startYear;
        this.startTerm = startTerm;
        this.minor = minor;
        this.transferCredits = transferCredits;
        this.track = track;
    }

    // Constructor of just User values
    public OnboardingFormRequestDto(Term startTerm, int startYear, Term endTerm, int endYear, String major, String minor, CsTrack track) {
        this.startTerm = startTerm;
        this.startYear = startYear;
        this.endTerm = endTerm;
        this.endYear = endYear;
        this.major = major;
        this.minor = minor;
        this.track = track;
    }
}
