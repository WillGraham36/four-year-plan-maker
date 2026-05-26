"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { useCourseApi } from "@/lib/api/planner/planner.client";
import {
  DEPARTMENT_CODES,
  DEPARTMENT_CODE_SET,
  normalizeCourseQuery,
} from "@/lib/courses/departments";
import { cn } from "@/lib/utils";
import { CourseAutocompleteSuggestion } from "@/lib/utils/types";
import { LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type DepartmentSuggestion = {
  type: "department";
  code: string;
};

type CourseSuggestion = CourseAutocompleteSuggestion & {
  type: "course";
};

type Suggestion = DepartmentSuggestion | CourseSuggestion;

type CourseAutocompleteProps = {
  value: string;
  onValueChange: (value: string) => void;
  onCourseSelect?: (courseId: string) => void;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
};

const MAX_SUGGESTIONS = 10;

export function CourseAutocomplete({
  value,
  onValueChange,
  onCourseSelect,
  disabled,
  maxLength,
  className,
}: CourseAutocompleteProps) {
  const { autocompleteCourses } = useCourseApi();
  const [courseSuggestions, setCourseSuggestions] = useState<
    CourseSuggestion[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const requestId = useRef(0);

  const normalizedValue = normalizeCourseQuery(value);
  const deptPrefix = normalizedValue.slice(0, 4);
  const shouldShowDepartments =
    normalizedValue.length > 0 &&
    normalizedValue.length < 4 &&
    /^[A-Z]+$/.test(normalizedValue);
  const shouldSearchCourses =
    hasTyped &&
    normalizedValue.length >= 5 &&
    DEPARTMENT_CODE_SET.has(deptPrefix) &&
    /^[A-Z]{4}[0-9][0-9A-Z]*$/.test(normalizedValue);

  const departmentSuggestions = useMemo<DepartmentSuggestion[]>(() => {
    if (!shouldShowDepartments) {
      return [];
    }

    return DEPARTMENT_CODES.filter((code) => code.startsWith(normalizedValue))
      .slice(0, MAX_SUGGESTIONS)
      .map((code) => ({ type: "department", code }));
  }, [normalizedValue, shouldShowDepartments]);

  useEffect(() => {
    if (!shouldSearchCourses) {
      requestId.current += 1;
      setCourseSuggestions([]);
      setLoading(false);
      return;
    }

    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;
    setLoading(true);

    const timeout = window.setTimeout(async () => {
      const response = await autocompleteCourses(normalizedValue);
      if (requestId.current !== currentRequestId) {
        return;
      }

      setCourseSuggestions(
        response.ok
          ? response.data.slice(0, MAX_SUGGESTIONS).map((suggestion) => ({
              ...suggestion,
              type: "course",
            }))
          : [],
      );
      setLoading(false);
      setHighlightedIndex(0);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [normalizedValue, shouldSearchCourses]);

  const suggestions: Suggestion[] = shouldShowDepartments
    ? departmentSuggestions
    : shouldSearchCourses
      ? courseSuggestions
      : [];
  const showEmptyState =
    open &&
    !loading &&
    suggestions.length === 0 &&
    (shouldShowDepartments || shouldSearchCourses);
  const showDropdown =
    open && !disabled && (loading || suggestions.length > 0 || showEmptyState);

  const selectSuggestion = (suggestion: Suggestion) => {
    if (suggestion.type === "department") {
      onValueChange(suggestion.code);
      setHasTyped(true);
      setOpen(true);
      return;
    }

    onValueChange(suggestion.courseId);
    onCourseSelect?.(suggestion.courseId);
    setHasTyped(false);
    setOpen(false);
  };

  return (
    <Popover open={showDropdown}>
      <PopoverAnchor asChild>
        <div className="w-full">
          <Input
            className={className}
            value={value}
            onChange={(event) => {
              onValueChange(event.target.value);
              setHasTyped(true);
              setOpen(true);
            }}
            onBlur={() => {
              window.setTimeout(() => setOpen(false), 120);
            }}
            onKeyDown={(event) => {
              if (!showDropdown || suggestions.length === 0) {
                return;
              }

              if (event.key === "ArrowDown") {
                event.preventDefault();
                setHighlightedIndex(
                  (current) => (current + 1) % suggestions.length,
                );
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setHighlightedIndex((current) =>
                  current === 0 ? suggestions.length - 1 : current - 1,
                );
              } else if (event.key === "Enter") {
                event.preventDefault();
                selectSuggestion(suggestions[highlightedIndex]);
              } else if (event.key === "Escape") {
                setOpen(false);
              }
            }}
            maxLength={maxLength}
            disabled={disabled}
            autoComplete="off"
          />
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="z-10000 w-48 max-h-60 overflow-y-auto p-0"
      >
        <Card className="gap-0 rounded-md border-0 bg-popover py-0 text-popover-foreground shadow-none">
          {loading && (
            <div className="flex h-12 items-center gap-2 px-3 text-muted-foreground">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              <span>Loading</span>
            </div>
          )}

          {!loading &&
            suggestions.map((suggestion, index) => (
              <button
                type="button"
                key={
                  suggestion.type === "department"
                    ? suggestion.code
                    : suggestion.courseId
                }
                className={cn(
                  "flex h-12 w-full items-center justify-between gap-3 px-3 text-left hover:bg-accent hover:text-accent-foreground md:text-sm",
                  highlightedIndex === index &&
                    "bg-accent text-accent-foreground",
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSuggestion(suggestion)}
              >
                {suggestion.type === "department" ? (
                  <span className="font-medium">{suggestion.code}</span>
                ) : (
                  <span className="font-medium">{suggestion.courseId}</span>
                )}
              </button>
            ))}

          {showEmptyState && (
            <div className="flex h-12 items-center px-3 text-sm text-muted-foreground">
              No matches
            </div>
          )}
        </Card>
      </PopoverContent>
    </Popover>
  );
}
