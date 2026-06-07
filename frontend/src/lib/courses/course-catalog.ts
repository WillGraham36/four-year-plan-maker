"use client";

import { normalizeCourseQuery } from "@/lib/courses/departments";
import { CourseCatalogEntryListSchema } from "@/lib/utils/schemas";
import {
  CourseAutocompleteSuggestion,
  CourseCatalogEntry,
} from "@/lib/utils/types";

const CATALOG_URL = "/course-catalog.json";
const DEFAULT_LIMIT = 10;

let catalogPromise: Promise<CourseCatalogEntry[] | null> | null = null;
let cachedCatalog: CourseCatalogEntry[] | null = null;
let catalogUnavailable = false;

const loadCourseCatalog = async (): Promise<CourseCatalogEntry[] | null> => {
  if (cachedCatalog) {
    return cachedCatalog;
  }

  if (catalogUnavailable) {
    return null;
  }

  if (!catalogPromise) {
    catalogPromise = fetch(CATALOG_URL, { cache: "force-cache" })
      .then(async (response) => {
        if (!response.ok) {
          catalogUnavailable = true;
          return null;
        }

        const parsedCatalog = CourseCatalogEntryListSchema.safeParse(
          await response.json(),
        );

        if (!parsedCatalog.success) {
          catalogUnavailable = true;
          return null;
        }

        cachedCatalog = parsedCatalog.data;
        return cachedCatalog;
      })
      .catch(() => {
        catalogUnavailable = true;
        return null;
      });
  }

  return catalogPromise;
};

const toAutocompleteSuggestions = (
  catalog: CourseCatalogEntry[],
  query: string,
  limit: number,
): CourseAutocompleteSuggestion[] => {
  const normalizedQuery = normalizeCourseQuery(query);
  const suggestions: CourseAutocompleteSuggestion[] = [];

  for (const course of catalog) {
    if (!normalizeCourseQuery(course.courseId).startsWith(normalizedQuery)) {
      continue;
    }

    suggestions.push({
      courseId: course.courseId,
      name: course.name,
      credits: course.credits,
    });

    if (suggestions.length >= limit) {
      break;
    }
  }

  return suggestions;
};

export const preloadCourseCatalog = () => {
  void loadCourseCatalog();
};

export const searchCachedCourseCatalog = (
  query: string,
  limit = DEFAULT_LIMIT,
): CourseAutocompleteSuggestion[] | null | undefined => {
  if (cachedCatalog) {
    return toAutocompleteSuggestions(cachedCatalog, query, limit);
  }

  return catalogUnavailable ? null : undefined;
};

export const searchCourseCatalog = async (
  query: string,
  limit = DEFAULT_LIMIT,
): Promise<CourseAutocompleteSuggestion[] | null> => {
  const catalog = await loadCourseCatalog();

  if (!catalog) {
    return null;
  }

  return toAutocompleteSuggestions(catalog, query, limit);
};
