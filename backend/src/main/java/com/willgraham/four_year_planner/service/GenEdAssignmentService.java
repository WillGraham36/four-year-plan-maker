package com.willgraham.four_year_planner.service;

import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.model.UserCourse;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
public class GenEdAssignmentService {
    private static final Set<String> TRACKED_GEN_EDS = Set.of(
            "FSAW", "FSPW", "FSMA", "FSOC", "FSAR",
            "DSNL", "DSNS", "DSHS", "DSHU", "DSSP",
            "SCIS", "DVUP", "DVCC"
    );

    private static final List<RequirementSlot> REQUIREMENT_SLOTS = List.of(
            new RequirementSlot("FSAW", List.of("FSAW")),
            new RequirementSlot("FSPW", List.of("FSPW")),
            new RequirementSlot("FSMA", List.of("FSMA")),
            new RequirementSlot("FSOC", List.of("FSOC")),
            new RequirementSlot("FSAR", List.of("FSAR")),
            new RequirementSlot("DSNL", List.of("DSNL")),
            new RequirementSlot("DSNS or DSNL", List.of("DSNS", "DSNL")),
            new RequirementSlot("DSHS", List.of("DSHS")),
            new RequirementSlot("DSHS", List.of("DSHS")),
            new RequirementSlot("DSHU", List.of("DSHU")),
            new RequirementSlot("DSHU", List.of("DSHU")),
            new RequirementSlot("DSSP", List.of("DSSP")),
            new RequirementSlot("DSSP", List.of("DSSP")),
            new RequirementSlot("SCIS", List.of("SCIS")),
            new RequirementSlot("SCIS", List.of("SCIS")),
            new RequirementSlot("DVUP", List.of("DVUP")),
            new RequirementSlot("DVUP or DVCC", List.of("DVUP", "DVCC"))
    );

    public AssignmentSnapshot assignCourses(List<UserCourse> courses) {
        List<UserCourse> orderedCourses = courses.stream()
                .sorted(Comparator
                        .comparing(UserCourse::getSemester)
                        .thenComparing(UserCourse::getIndex, Comparator.nullsLast(Integer::compareTo))
                        .thenComparing(UserCourse::getCourseId)
                        .thenComparing(UserCourse::getId))
                .toList();

        List<CourseContext> courseContexts = buildCourseContexts(orderedCourses);
        int stateCount = 1 << REQUIREMENT_SLOTS.size();
        int[] bestScores = new int[stateCount];
        Arrays.fill(bestScores, -1);
        bestScores[0] = 0;

        int[][] previousMasksByStep = new int[courseContexts.size() + 1][stateCount];
        short[][] choiceIndexesByStep = new short[courseContexts.size() + 1][stateCount];
        for (int step = 0; step <= courseContexts.size(); step++) {
            Arrays.fill(previousMasksByStep[step], -1);
            Arrays.fill(choiceIndexesByStep[step], (short) -1);
        }

        List<List<CourseChoice>> choicesByStep = new ArrayList<>();

        for (int step = 0; step < courseContexts.size(); step++) {
            CourseContext courseContext = courseContexts.get(step);
            List<CourseChoice> choices = buildChoicesForCourse(courseContext);
            choicesByStep.add(choices);

            int[] nextScores = new int[stateCount];
            Arrays.fill(nextScores, -1);

            for (int currentMask = 0; currentMask < stateCount; currentMask++) {
                if (bestScores[currentMask] < 0) {
                    continue;
                }

                for (short choiceIndex = 0; choiceIndex < choices.size(); choiceIndex++) {
                    CourseChoice choice = choices.get(choiceIndex);
                    if ((currentMask & choice.requirementMask()) != 0) {
                        continue;
                    }

                    int newMask = currentMask | choice.requirementMask();
                    int newScore = bestScores[currentMask] + Integer.bitCount(choice.requirementMask());

                    short existingChoiceIndex = choiceIndexesByStep[step + 1][newMask];
                    CourseChoice existingChoice = existingChoiceIndex >= 0
                            ? choices.get(existingChoiceIndex)
                            : null;

                    if (newScore > nextScores[newMask]
                            || (newScore == nextScores[newMask] && isPreferredChoice(choice, existingChoice))) {
                        nextScores[newMask] = newScore;
                        previousMasksByStep[step + 1][newMask] = currentMask;
                        choiceIndexesByStep[step + 1][newMask] = choiceIndex;
                    }
                }
            }

            bestScores = nextScores;
        }

        int bestMask = 0;
        int bestScore = -1;
        for (int mask = 0; mask < bestScores.length; mask++) {
            if (bestScores[mask] > bestScore) {
                bestScore = bestScores[mask];
                bestMask = mask;
            }
        }

        Map<Long, CourseAssignment> courseAssignments = new HashMap<>();
        Map<Integer, RequirementAssignment> filledRequirements = new HashMap<>();

        int currentMask = bestMask;
        for (int step = courseContexts.size(); step >= 1; step--) {
            short choiceIndex = choiceIndexesByStep[step][currentMask];
            CourseChoice choice = choicesByStep.get(step - 1).get(choiceIndex);
            CourseContext courseContext = courseContexts.get(step - 1);

            if (choice.branchIndex() != null) {
                courseAssignments.put(
                        courseContext.userCourse().getId(),
                        new CourseAssignment(choice.branchTokens(), choice.branchIndex())
                );
            }

            for (AssignedSlot assignedSlot : choice.assignedSlots()) {
                filledRequirements.put(
                        assignedSlot.slotIndex(),
                        new RequirementAssignment(
                                REQUIREMENT_SLOTS.get(assignedSlot.slotIndex()).name(),
                                assignedSlot.genEd(),
                                courseContext.userCourse().getCourseId(),
                                courseContext.userCourse().getSemester().getName(),
                                nullToEmpty(courseContext.userCourse().getTransferCreditName())
                        )
                );
            }

            currentMask = previousMasksByStep[step][currentMask];
        }

        List<RequirementAssignment> requirementAssignments = new ArrayList<>(REQUIREMENT_SLOTS.size());
        for (int slotIndex = 0; slotIndex < REQUIREMENT_SLOTS.size(); slotIndex++) {
            RequirementAssignment assignment = filledRequirements.get(slotIndex);
            requirementAssignments.add(assignment == null
                    ? new RequirementAssignment(REQUIREMENT_SLOTS.get(slotIndex).name(), "", "", "", "")
                    : assignment);
        }

        return new AssignmentSnapshot(requirementAssignments, courseAssignments);
    }

    private List<CourseContext> buildCourseContexts(List<UserCourse> courses) {
        Map<Semester, Set<String>> courseIdsBySemester = new HashMap<>();
        for (UserCourse course : courses) {
            courseIdsBySemester
                    .computeIfAbsent(course.getSemester(), ignored -> new java.util.HashSet<>())
                    .add(course.getCourseId());
        }

        List<CourseContext> contexts = new ArrayList<>();
        for (UserCourse course : courses) {
            List<List<String>> branchGroups = getGenEdGroups(course);
            List<BranchContext> validBranches = new ArrayList<>();
            Set<String> semesterCourseIds = courseIdsBySemester.getOrDefault(course.getSemester(), Set.of());

            for (int branchIndex = 0; branchIndex < branchGroups.size(); branchIndex++) {
                List<String> rawBranch = branchGroups.get(branchIndex);
                List<String> cleanedGenEds = cleanBranch(rawBranch, semesterCourseIds);
                if (cleanedGenEds == null) {
                    continue;
                }

                validBranches.add(new BranchContext(branchIndex, List.copyOf(rawBranch), cleanedGenEds));
            }

            contexts.add(new CourseContext(course, validBranches));
        }

        return contexts;
    }

    private List<List<String>> getGenEdGroups(UserCourse course) {
        if (course.getTransferGenEdsOverride() != null && !course.getTransferGenEdsOverride().isEmpty()) {
            return course.getTransferGenEdsOverride();
        }

        if (course.getCourse() == null || course.getCourse().getGenEds() == null) {
            return List.of();
        }

        return course.getCourse().getGenEds();
    }

    private List<String> cleanBranch(List<String> rawBranch, Set<String> semesterCourseIds) {
        List<String> cleanedGenEds = new ArrayList<>();

        for (String rawGenEd : rawBranch) {
            if (rawGenEd == null || rawGenEd.isBlank() || Objects.equals(rawGenEd, "NONE")) {
                continue;
            }

            String baseGenEd = rawGenEd;
            if (rawGenEd.contains("|")) {
                String[] parts = rawGenEd.split("\\|", 2);
                baseGenEd = parts[0];
                if (parts.length < 2 || !semesterCourseIds.contains(parts[1])) {
                    return null;
                }
            }

            if (TRACKED_GEN_EDS.contains(baseGenEd)) {
                cleanedGenEds.add(baseGenEd);
            }
        }

        return cleanedGenEds;
    }

    private List<CourseChoice> buildChoicesForCourse(CourseContext courseContext) {
        List<CourseChoice> choices = new ArrayList<>();
        choices.add(new CourseChoice(null, List.of(), 0, List.of()));

        for (BranchContext branchContext : courseContext.validBranches()) {
            Map<Integer, List<AssignedSlot>> optionsByMask = new LinkedHashMap<>();
            enumerateSlotAssignments(branchContext.cleanedGenEds(), 0, 0, new ArrayList<>(), optionsByMask);

            for (Map.Entry<Integer, List<AssignedSlot>> option : optionsByMask.entrySet()) {
                choices.add(new CourseChoice(
                        branchContext.branchIndex(),
                        branchContext.rawBranch(),
                        option.getKey(),
                        List.copyOf(option.getValue())
                ));
            }
        }

        return choices;
    }

    private void enumerateSlotAssignments(
            List<String> genEds,
            int genEdIndex,
            int usedMask,
            List<AssignedSlot> currentAssignments,
            Map<Integer, List<AssignedSlot>> optionsByMask
    ) {
        if (genEdIndex >= genEds.size()) {
            optionsByMask.putIfAbsent(usedMask, List.copyOf(currentAssignments));
            return;
        }

        enumerateSlotAssignments(genEds, genEdIndex + 1, usedMask, currentAssignments, optionsByMask);

        String genEd = genEds.get(genEdIndex);
        for (int slotIndex = 0; slotIndex < REQUIREMENT_SLOTS.size(); slotIndex++) {
            RequirementSlot slot = REQUIREMENT_SLOTS.get(slotIndex);
            int slotMask = 1 << slotIndex;

            if ((usedMask & slotMask) != 0 || !slot.accepts(genEd)) {
                continue;
            }

            currentAssignments.add(new AssignedSlot(slotIndex, genEd));
            enumerateSlotAssignments(
                    genEds,
                    genEdIndex + 1,
                    usedMask | slotMask,
                    currentAssignments,
                    optionsByMask
            );
            currentAssignments.remove(currentAssignments.size() - 1);
        }
    }

    private boolean isPreferredChoice(CourseChoice candidate, CourseChoice existing) {
        if (existing == null) {
            return true;
        }

        if (candidate.branchIndex() != null && existing.branchIndex() == null) {
            return true;
        }
        if (candidate.branchIndex() == null && existing.branchIndex() != null) {
            return false;
        }

        if (candidate.branchIndex() != null && existing.branchIndex() != null) {
            int branchComparison = Integer.compare(candidate.branchIndex(), existing.branchIndex());
            if (branchComparison != 0) {
                return branchComparison < 0;
            }
        }

        return candidate.branchTokens().toString().compareTo(existing.branchTokens().toString()) < 0;
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private record RequirementSlot(String name, List<String> acceptedGenEds) {
        boolean accepts(String genEd) {
            return acceptedGenEds.contains(genEd);
        }
    }

    private record CourseContext(UserCourse userCourse, List<BranchContext> validBranches) {}

    private record BranchContext(int branchIndex, List<String> rawBranch, List<String> cleanedGenEds) {}

    private record AssignedSlot(int slotIndex, String genEd) {}

    private record CourseChoice(
            Integer branchIndex,
            List<String> branchTokens,
            int requirementMask,
            List<AssignedSlot> assignedSlots
    ) {}

    public record CourseAssignment(List<String> assignedBranch, Integer branchIndex) {}

    public record RequirementAssignment(
            String requirementName,
            String satisfiedByGenEd,
            String courseId,
            String semesterName,
            String transferCreditName
    ) {}

    public record AssignmentSnapshot(
            List<RequirementAssignment> requirementAssignments,
            Map<Long, CourseAssignment> courseAssignments
    ) {}
}
