package com.willgraham.four_year_planner.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.willgraham.four_year_planner.dto.UmdIoCourseDto;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UmdIoCourseClient {
    private static final String API_BASE_URL = "https://api.umd.io/v1/courses";
    private static final int PER_PAGE = 100;
    private static final Duration CACHE_TTL = Duration.ofMinutes(10);

    private final RestTemplate restTemplate = new RestTemplate();
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    public List<UmdIoCourseDto> fetchMinifiedDepartmentCourses(String deptId) {
        String cacheKey = "minified:" + deptId;
        CacheEntry cached = cache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            return cached.courses();
        }

        List<UmdIoCourseDto> courses = onlyDepartmentCourses(fetchDepartmentPages(deptId, true), deptId);
        if (courses.isEmpty()) {
            courses = onlyDepartmentCourses(fetchDepartmentPages(deptId, false), deptId);
        }
        cache.put(cacheKey, new CacheEntry(courses, Instant.now().plus(CACHE_TTL)));
        return courses;
    }

    public List<UmdIoCourseDto> fetchFullDepartmentCourses(String deptId) {
        return onlyDepartmentCourses(fetchDepartmentPages(deptId, false), deptId);
    }

    public UmdIoCourseDto fetchCourse(String courseId) {
        try {
            JsonNode response = restTemplate.getForObject(API_BASE_URL + "/" + courseId, JsonNode.class);
            List<UmdIoCourseDto> courses = parseCourseList(response, courseId.substring(0, 4));
            return courses.isEmpty() ? null : courses.getFirst();
        } catch (RestClientException e) {
            return null;
        }
    }

    private List<UmdIoCourseDto> fetchDepartmentPages(String deptId, boolean minified) {
        List<UmdIoCourseDto> courses = new ArrayList<>();
        int page = 1;

        while (true) {
            String url = UriComponentsBuilder
                    .fromHttpUrl(minified ? API_BASE_URL + "/list" : API_BASE_URL)
                    .queryParam("dept_id", deptId)
                    .queryParam("page", page)
                    .queryParam("per_page", PER_PAGE)
                    .toUriString();

            JsonNode response;
            try {
                response = restTemplate.getForObject(url, JsonNode.class);
            } catch (RestClientException e) {
                break;
            }

            List<UmdIoCourseDto> pageCourses = parseCourseList(response, deptId);
            if (pageCourses.isEmpty()) {
                break;
            }

            courses.addAll(pageCourses);
            if (pageCourses.size() < PER_PAGE) {
                break;
            }

            page++;
        }

        return courses;
    }

    private List<UmdIoCourseDto> onlyDepartmentCourses(List<UmdIoCourseDto> courses, String deptId) {
        return courses.stream()
                .filter(course -> course.courseId() != null && course.courseId().startsWith(deptId))
                .toList();
    }

    private List<UmdIoCourseDto> parseCourseList(JsonNode response, String fallbackDeptId) {
        if (response == null || response.isNull()) {
            return List.of();
        }

        JsonNode courseNodes = response.isArray() ? response : List.of(response).stream().findFirst().orElse(response);
        List<UmdIoCourseDto> courses = new ArrayList<>();

        if (courseNodes.isArray()) {
            for (JsonNode courseNode : courseNodes) {
                parseCourse(courseNode, fallbackDeptId).ifPresent(courses::add);
            }
        } else {
            parseCourse(courseNodes, fallbackDeptId).ifPresent(courses::add);
        }

        return courses;
    }

    private java.util.Optional<UmdIoCourseDto> parseCourse(JsonNode node, String fallbackDeptId) {
        String courseId = textValue(node, "course_id");
        if (courseId == null || courseId.length() < 4) {
            return java.util.Optional.empty();
        }

        String deptId = textValue(node, "dept_id");
        if (deptId == null || deptId.isBlank()) {
            deptId = courseId.substring(0, 4);
        }
        if (deptId == null || deptId.isBlank()) {
            deptId = fallbackDeptId;
        }

        return java.util.Optional.of(new UmdIoCourseDto(
                courseId,
                textValue(node, "name"),
                deptId,
                intValue(node, "credits"),
                genEdsValue(node.get("gen_ed")),
                textValue(node, "description")
        ));
    }

    private String textValue(JsonNode node, String fieldName) {
        JsonNode value = node == null ? null : node.get(fieldName);
        return value == null || value.isNull() ? null : value.asText();
    }

    private Integer intValue(JsonNode node, String fieldName) {
        JsonNode value = node == null ? null : node.get(fieldName);
        if (value == null || value.isNull()) {
            return null;
        }

        try {
            return Integer.parseInt(value.asText());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private List<List<String>> genEdsValue(JsonNode genEdsNode) {
        if (genEdsNode == null || !genEdsNode.isArray() || genEdsNode.isEmpty()) {
            return null;
        }

        List<List<String>> genEdGroups = new ArrayList<>();
        for (JsonNode groupNode : genEdsNode) {
            if (groupNode.isArray()) {
                List<String> group = new ArrayList<>();
                for (JsonNode genEdNode : groupNode) {
                    group.add(genEdNode.asText());
                }
                genEdGroups.add(group);
            } else {
                genEdGroups.add(List.of(groupNode.asText()));
            }
        }

        return genEdGroups;
    }

    private record CacheEntry(List<UmdIoCourseDto> courses, Instant expiresAt) {
        boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }
}
