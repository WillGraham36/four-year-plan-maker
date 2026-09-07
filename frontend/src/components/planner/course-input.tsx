"use client";
import { Course } from "@/lib/utils/types";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { CircleAlert, Info } from "lucide-react";
import SelectGenEdHighlight from "./select-gened-highlight";
import { arraysEqual } from "@/lib/utils";
import { useRequirements } from "../context/requirements-context";
import { useSemester } from "../context/semester-context";
import { useCourseApi } from "@/lib/api/planner/planner.client";
import { CourseAutocomplete } from "./course-autocomplete";
import { normalizeCourseQuery } from "@/lib/courses/departments";

const MAX_COURSE_ID_LENGTH = 9;
const FULL_COURSE_ID_REGEX = /^[A-Z]{4}[0-9]{3}[A-Z]{0,2}$/;

const emptyCourse = (courseId: string = ""): Course => ({
  courseId,
  name: "",
  credits: -1,
  genEds: [["NONE"]],
});

type CourseInputProps = {
  initialCourse?: Course;
  disabled?: boolean;
  isCore?: boolean;
  index: number;
};

const CourseInput = ({
  initialCourse,
  disabled,
  isCore = true,
  index,
}: CourseInputProps) => {
  const { courses, addCourse, removeCourse, hasCourse, term, year } =
    useSemester();
  const {
    saveNewCourseAndRefreshGenEdsAndULCourses,
    deleteSemesterCoursesAndRefreshGenEdsAndULCourses,
  } = useRequirements();
  const { getCourseInfo } = useCourseApi();

  const [course, setCourse] = useState<Course>(initialCourse || emptyCourse());
  const [courseIdInput, setCourseIdInput] = useState<string>(
    initialCourse?.courseId || "",
  );
  const [acceptedCourseId, setAcceptedCourseId] = useState<string>(
    initialCourse?.courseId || "",
  );
  const [courseIdToVerify, setCourseIdToVerify] = useState<string>("");
  const [debouncedCourseIdToVerify] = useDebounce(courseIdToVerify, 250);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const verifiedCourseId = useRef<string>(initialCourse?.courseId || "");
  const courseIdInputRef = useRef<string>(initialCourse?.courseId || "");
  const lookupRequestId = useRef<number>(0);
  const pendingReset = useRef<Promise<void>>(Promise.resolve());

  const courseIds = useMemo(
    () => new Set(courses.map((semesterCourse) => semesterCourse.courseId)),
    [courses],
  );

  useEffect(() => {
    const updatedCourse = courses.find(
      (c) => c.courseId === verifiedCourseId.current,
    );
    if (updatedCourse) {
      setCourse((prev) => {
        // Check if the course data has actually changed
        const genEdsChanged =
          JSON.stringify(prev.genEds) !== JSON.stringify(updatedCourse.genEds);
        const assignedGenEdsChanged =
          JSON.stringify(prev.assignedGenEds) !==
          JSON.stringify(updatedCourse.assignedGenEds);
        const assignedBranchIndexChanged =
          prev.assignedGenEdBranchIndex !==
          updatedCourse.assignedGenEdBranchIndex;
        const nameChanged = prev.name !== updatedCourse.name;
        const creditsChanged = prev.credits !== updatedCourse.credits;

        // If anything changed, return the updated course
        if (
          genEdsChanged ||
          assignedGenEdsChanged ||
          assignedBranchIndexChanged ||
          nameChanged ||
          creditsChanged
        ) {
          return updatedCourse;
        }

        return prev;
      });
    }
  }, [courses]);

  const removeVerifiedCourse = async () => {
    const courseIdToRemove = verifiedCourseId.current;

    if (courseIdToRemove === "") return;

    if (hasCourse(courseIdToRemove)) {
      removeCourse(courseIdToRemove);
      await deleteSemesterCoursesAndRefreshGenEdsAndULCourses(
        [courseIdToRemove],
        term,
        year,
      );
    }

    verifiedCourseId.current = "";
  };

  const resetCourseFields = async (courseId: string = "") => {
    setAcceptedCourseId("");
    setCourse(emptyCourse(courseId));
    await removeVerifiedCourse();
  };

  const handleCourseIdChange = async (value: string) => {
    const courseId = normalizeCourseQuery(value).slice(0, MAX_COURSE_ID_LENGTH);

    lookupRequestId.current += 1;
    courseIdInputRef.current = courseId;
    setCourseIdInput(courseId);
    setCourseIdToVerify("");
    setErrorMessage("");

    const previousVerifiedCourseId = verifiedCourseId.current;

    if (courseId !== verifiedCourseId.current) {
      const reset = resetCourseFields(courseId);
      pendingReset.current = reset;
      await reset;
    }

    if (courseIdInputRef.current !== courseId) {
      return;
    }

    if (courseId.length < 7) {
      return;
    }

    if (
      courses.some(
        (c) =>
          c.courseId === courseId && c.courseId !== previousVerifiedCourseId,
      )
    ) {
      setAcceptedCourseId("");
      setErrorMessage("Course already added");
      return;
    }

    if (FULL_COURSE_ID_REGEX.test(courseId)) {
      setCourseIdToVerify(courseId);
    }
  };

  useEffect(() => {
    const courseId = debouncedCourseIdToVerify;

    if (!FULL_COURSE_ID_REGEX.test(courseId)) {
      return;
    }

    if (courseIdInputRef.current !== courseId) {
      return;
    }

    const previousVerifiedCourseId = verifiedCourseId.current;

    if (
      courses.some(
        (c) =>
          c.courseId === courseId && c.courseId !== previousVerifiedCourseId,
      )
    ) {
      setAcceptedCourseId("");
      setErrorMessage("Course already added");
      return;
    }

    const verifyCourse = async () => {
      const requestId = lookupRequestId.current + 1;
      lookupRequestId.current = requestId;

      try {
        await pendingReset.current;

        if (
          lookupRequestId.current !== requestId ||
          courseIdInputRef.current !== courseId
        ) {
          return;
        }

        const courseInfo = await getCourseInfo(courseId);
        const isCurrentRequest =
          lookupRequestId.current === requestId &&
          courseIdInputRef.current === courseId;

        if (!isCurrentRequest) {
          return;
        }

        if (!courseInfo.ok) {
          setAcceptedCourseId("");
          setErrorMessage(courseInfo.message);
          await resetCourseFields(courseId);
          return;
        }
        setCourse({
          ...courseInfo.data,
        });
        addCourse(courseInfo.data);
        setAcceptedCourseId(courseId);
        await saveNewCourseAndRefreshGenEdsAndULCourses(
          { ...courseInfo.data },
          term,
          year,
          index,
        );

        if (courseIdInputRef.current !== courseId) {
          removeCourse(courseId);
          await deleteSemesterCoursesAndRefreshGenEdsAndULCourses(
            [courseId],
            term,
            year,
          );
          setCourse(emptyCourse(courseIdInputRef.current));
          setAcceptedCourseId("");
          return;
        }

        verifiedCourseId.current = courseId;
      } catch (e) {
        if (courseIdInputRef.current === courseId) {
          setAcceptedCourseId("");
          setErrorMessage("Error fetching course information");
        }
      }
    };

    void verifyCourse();
  }, [debouncedCourseIdToVerify]);

  const displayGenEds = () => {
    // Courses without Gen Eds are represented as either [] or [["NONE"]]
    // depending on whether the data came from the catalog or the legacy API.
    const genEdGroups = course.genEds ?? [];
    if (genEdGroups.length === 0 || genEdGroups[0]?.[0] === "NONE") {
      return null;
    }

    if (genEdGroups[0].length > 0) {
      const hasOrChoice = genEdGroups.length > 1;

      return (
        <span className="flex items-center gap-1">
          {genEdGroups.map((genEdGroup, groupIndex) => {
            const genEdContent = (
              <React.Fragment>
                {genEdGroup.map((genEd, genEdIndex) => (
                  <React.Fragment key={`${groupIndex}-${genEdIndex}`}>
                    {genEdIndex > 0 && ", "}
                    {genEd.length > 4 ? (
                      !courseIds.has(genEd.slice(5)) ? (
                        <Tooltip>
                          <TooltipTrigger className="text-orange-500 flex items-center gap-1 cursor-pointer">
                            <Info size={16} className="inline" />
                            {genEd.slice(0, 4)}
                          </TooltipTrigger>
                          <TooltipContent className="text-center">
                            Must be taken with{" "}
                            <span className="font-bold">{genEd.slice(5)}</span>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        genEd.slice(0, 4)
                      )
                    ) : (
                      genEd
                    )}
                  </React.Fragment>
                ))}
              </React.Fragment>
            );

            return (
              <React.Fragment key={groupIndex}>
                {hasOrChoice ? (
                  <SelectGenEdHighlight
                    selected={
                      course.assignedGenEdBranchIndex != null
                        ? groupIndex === course.assignedGenEdBranchIndex
                        : arraysEqual(genEdGroup, course.assignedGenEds || [])
                    }
                    isFirstInGroup={groupIndex === 0}
                  >
                    {genEdContent}
                  </SelectGenEdHighlight>
                ) : (
                  genEdContent
                )}
                {groupIndex < genEdGroups.length - 1 && <span>or</span>}
              </React.Fragment>
            );
          })}
        </span>
      );
    }

    return "-";
  };

  return (
    <div className="flex flex-col">
      <div
        className={`grid ${isCore ? "grid-cols-[1fr_2fr_3.5rem]" : "grid-cols-[1fr_2fr_7rem]"} relative`}
      >
        <div className="flex flex-row items-center">
          {errorMessage.length > 0 && (
            <Tooltip>
              <TooltipTrigger className="text-red-500 flex items-center cursor-pointer h-full border-b pl-1.5">
                <CircleAlert size={16} className="inline" />
              </TooltipTrigger>
              <TooltipContent className="text-center">
                {errorMessage}
              </TooltipContent>
            </Tooltip>
          )}
          <CourseAutocomplete
            className="p-0 px-3 h-8 rounded-none w-full focus-visible:ring-0 focus-visible:ring-offset-0 border-x-0 border-t-0 border-b text-xs md:text-sm !bg-card !border-border disabled:cursor-default disabled:opacity-100 disabled:text-muted-foreground"
            value={courseIdInput}
            onValueChange={(value) => {
              void handleCourseIdChange(value);
            }}
            acceptedCourseId={acceptedCourseId}
            maxLength={MAX_COURSE_ID_LENGTH}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center h-8 w-full border-b border-x bg-background text-xs md:text-sm cursor-default px-3 border-t-0">
          {displayGenEds()}
        </div>

        <div className="flex items-center justify-center h-8 w-full border-b bg-background text-xs md:text-sm cursor-default">
          {course.credits === -1 ? "" : course.credits}
        </div>
      </div>
    </div>
  );
};

export default CourseInput;
