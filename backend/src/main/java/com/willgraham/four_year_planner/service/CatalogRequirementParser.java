package com.willgraham.four_year_planner.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.willgraham.four_year_planner.model.CurriculumProgramType;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.Node;
import org.jsoup.nodes.TextNode;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CatalogRequirementParser {
    private static final String SCHEMA_VERSION = "curriculum.requirements.ai.v1";
    private static final String PARSER_VERSION = "deterministic-umd-catalog-html-v1";
    private static final Pattern CATALOG_YEAR_PATTERN = Pattern.compile("(20\\d{2}-20\\d{2})\\s+Catalog");
    private static final Pattern COURSE_PATTERN = Pattern.compile(
            "\\b[A-Z]{4}(?:/[A-Z]{4})?\\s*(?:[0-9]{3}[A-Z]?|[0-9]XX|XXX)\\b",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern SELECT_COUNT_PATTERN = Pattern.compile(
            "\\b(?:select|choose|take)\\s+(?:at least\\s+)?(one|two|three|four|five|six|seven|eight|nine|ten|\\d+)\\b",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern CREDIT_COUNT_PATTERN = Pattern.compile(
            "\\b(?:at least\\s+)?(\\d+)(?:-(\\d+))?\\s+credits?\\b",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern CREDIT_CELL_PATTERN = Pattern.compile("^\\d+(?:-\\d+)?$");
    private static final Pattern REQUIREMENT_NOTE_PATTERN = Pattern.compile(
            "\\b(must|required|requirement|credit|grade|cannot|elective|area|specialization|minimum)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private final ObjectMapper objectMapper;

    public CatalogRequirementParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public ParsedCatalogRequirement parse(
            String html,
            String sourceUrl,
            String fallbackTitle,
            CurriculumProgramType programType
    ) {
        Document document = Jsoup.parse(html, sourceUrl);
        Element content = mainContent(document);
        Element cleanedContent = cleaned(content);
        String catalogTitle = firstText(document.select("h1")).orElse(fallbackTitle);
        String rawRequirementsText = plainText(cleanedContent);
        List<String> warnings = new ArrayList<>();

        if (rawRequirementsText.length() < 250) {
            warnings.add("The extracted requirement text is short; review the raw source before approving.");
        }

        ObjectNode structuredRequirements = objectMapper.createObjectNode();
        structuredRequirements.put("schemaVersion", SCHEMA_VERSION);
        structuredRequirements.put("parserVersion", PARSER_VERSION);
        structuredRequirements.put("transformationMode", "deterministic");
        structuredRequirements.put("sourceUrl", sourceUrl);
        structuredRequirements.put("scrapedAt", Instant.now().toString());
        structuredRequirements.put("catalogYear", catalogYear(document).orElse(null));
        structuredRequirements.put("catalogTitle", catalogTitle);
        structuredRequirements.put("programType", programType.name());

        ArrayNode policyNotes = structuredRequirements.putArray("policyNotes");
        ArrayNode groups = structuredRequirements.putArray("groups");
        buildPolicyNotesAndGroups(cleanedContent, policyNotes, groups, warnings);
        structuredRequirements.set("courseIndex", detectedCourseIds(rawRequirementsText));
        structuredRequirements.set("warnings", objectMapper.valueToTree(warnings));

        if (groups.isEmpty()) {
            warnings.add("No course-list tables were detected; the structured JSON is mostly narrative text.");
            structuredRequirements.set("warnings", objectMapper.valueToTree(warnings));
        }

        return new ParsedCatalogRequirement(
                catalogTitle,
                catalogYear(document).orElse(null),
                rawRequirementsText,
                structuredRequirements,
                warnings
        );
    }

    private void buildPolicyNotesAndGroups(
            Element content,
            ArrayNode policyNotes,
            ArrayNode groups,
            List<String> warnings
    ) {
        String currentHeading = "Overview";
        Elements blocks = content.select("h2, h3, h4, h5, p, li, table");
        int tableIndex = 0;

        for (Element block : blocks) {
            if (block.tagName().equals("table") && block.parents().stream().anyMatch(parent -> parent.tagName().equals("table"))) {
                continue;
            }
            if (!block.tagName().equals("table") && block.parents().stream().anyMatch(parent -> parent.tagName().equals("table"))) {
                continue;
            }

            String text = normalizeWhitespace(block.text());
            if (text.isBlank()) {
                continue;
            }

            if (isHeading(block)) {
                currentHeading = text;
                continue;
            }

            if (block.tagName().equals("table")) {
                groups.add(parseTable(block, ++tableIndex, currentHeading, warnings));
            } else if (isRequirementNote(text)) {
                ObjectNode note = objectMapper.createObjectNode();
                note.put("section", currentHeading);
                note.put("text", text);
                policyNotes.add(note);
            }
        }
    }

    private ObjectNode parseTable(Element table, int tableIndex, String heading, List<String> warnings) {
        ObjectNode tableNode = objectMapper.createObjectNode();
        tableNode.put("id", "course-list-" + tableIndex);
        tableNode.put("type", "course_list");
        tableNode.put("heading", heading);
        tableNode.set("rows", objectMapper.createArrayNode());

        ArrayNode rows = (ArrayNode) tableNode.get("rows");
        Elements tableRows = table.select("tr");
        int rowIndex = 0;

        for (Element row : tableRows) {
            List<String> cellTexts = row.select("th, td").stream()
                    .map(Element::text)
                    .map(this::normalizeWhitespace)
                    .filter(value -> !value.isBlank())
                    .toList();

            String rowText = cellTexts.isEmpty() ? normalizeWhitespace(row.text()) : normalizeWhitespace(String.join(" ", cellTexts));
            if (rowText.isBlank() || rowText.equalsIgnoreCase("Course List Course Title Credits")) {
                continue;
            }

            ObjectNode rowNode = objectMapper.createObjectNode();
            rowNode.put("index", ++rowIndex);
            rowNode.put("type", rowType(rowText, cellTexts));
            rowNode.put("text", label(cellTexts, rowText));
            creditValue(cellTexts, rowText).ifPresent(credits -> rowNode.put("credits", credits));

            ArrayNode courseIds = courseIds(rowText);
            if (!courseIds.isEmpty()) {
                rowNode.set("courseIds", courseIds);
            }

            selectionRule(rowText, cellTexts).ifPresent(rule -> rowNode.set("selectionRule", rule));
            rows.add(rowNode);
        }

        if (rows.isEmpty()) {
            warnings.add("A course-list table was detected but no readable rows were extracted.");
        }

        return tableNode;
    }

    private boolean isRequirementNote(String text) {
        return REQUIREMENT_NOTE_PATTERN.matcher(text).find();
    }

    private String rowType(String rowText, List<String> cellTexts) {
        String lowerText = rowText.toLowerCase(Locale.ROOT);
        if (lowerText.startsWith("total credits")) {
            return "total_credits";
        }
        if (SELECT_COUNT_PATTERN.matcher(rowText).find()) {
            return lowerText.contains("credit") ? "credit_or_course_selection" : "choose_n";
        }
        if (lowerText.startsWith("select ") || lowerText.startsWith("choose ")) {
            return "selection";
        }
        if (COURSE_PATTERN.matcher(rowText).find()) {
            return "course";
        }
        if (cellTexts.size() <= 1 || lowerText.contains("requirement") || lowerText.endsWith("courses")) {
            return "group_heading";
        }
        return "note";
    }

    private Optional<ObjectNode> selectionRule(String rowText, List<String> cellTexts) {
        ObjectNode rule = objectMapper.createObjectNode();
        boolean hasRule = false;

        Matcher selectMatcher = SELECT_COUNT_PATTERN.matcher(rowText);
        if (selectMatcher.find()) {
            rule.put("minCourses", numberWord(selectMatcher.group(1)));
            hasRule = true;
        }

        Matcher creditMatcher = CREDIT_COUNT_PATTERN.matcher(rowText);
        if (creditMatcher.find()) {
            rule.put("minCredits", Integer.parseInt(creditMatcher.group(1)));
            if (creditMatcher.group(2) != null) {
                rule.put("maxCredits", Integer.parseInt(creditMatcher.group(2)));
            }
            hasRule = true;
        }

        creditValue(cellTexts, rowText).ifPresent(credits -> {
            if (!rule.has("creditsText")) {
                rule.put("creditsText", credits);
            }
        });

        return hasRule ? Optional.of(rule) : Optional.empty();
    }

    private String label(List<String> cellTexts, String rowText) {
        if (cellTexts.size() <= 1) {
            return rowText;
        }

        String lastCell = cellTexts.getLast();
        if (CREDIT_CELL_PATTERN.matcher(lastCell).matches()) {
            return normalizeWhitespace(String.join(" ", cellTexts.subList(0, cellTexts.size() - 1)));
        }
        return rowText;
    }

    private Optional<String> creditValue(List<String> cellTexts, String rowText) {
        if (!cellTexts.isEmpty()) {
            String lastCell = cellTexts.getLast();
            if (CREDIT_CELL_PATTERN.matcher(lastCell).matches()) {
                return Optional.of(lastCell);
            }
        }

        Matcher matcher = CREDIT_COUNT_PATTERN.matcher(rowText);
        if (matcher.find()) {
            return Optional.of(matcher.group(2) == null ? matcher.group(1) : matcher.group(1) + "-" + matcher.group(2));
        }

        return Optional.empty();
    }

    private ArrayNode detectedCourseIds(String text) {
        Set<String> uniqueCourses = new LinkedHashSet<>();
        Matcher matcher = COURSE_PATTERN.matcher(text);
        while (matcher.find()) {
            uniqueCourses.addAll(expandedCourseIds(normalizeCourseCode(matcher.group())));
        }
        return objectMapper.valueToTree(uniqueCourses);
    }

    private ArrayNode courseIds(String text) {
        ArrayNode courseIds = objectMapper.createArrayNode();
        Set<String> uniqueCourses = new LinkedHashSet<>();
        Matcher matcher = COURSE_PATTERN.matcher(text);
        while (matcher.find()) {
            uniqueCourses.addAll(expandedCourseIds(normalizeCourseCode(matcher.group())));
        }

        for (String courseCode : uniqueCourses) {
            courseIds.add(courseCode);
        }

        return courseIds;
    }

    private Set<String> expandedCourseIds(String courseCode) {
        if (!courseCode.contains("/")) {
            return Set.of(courseCode);
        }

        Set<String> alternatives = new LinkedHashSet<>();
        String suffix = courseCode.replaceFirst("^.*?/", "").replaceAll("^[A-Z]{4}", "");
        for (String dept : courseCode.substring(0, courseCode.indexOf('/')).split("/")) {
            alternatives.add(dept + suffix);
        }
        alternatives.add(courseCode.substring(courseCode.indexOf('/') + 1));
        return alternatives;
    }

    private String normalizeCourseCode(String courseCode) {
        return normalizeWhitespace(courseCode).replace(" ", "").toUpperCase(Locale.ROOT);
    }

    private int numberWord(String value) {
        return switch (value.toLowerCase(Locale.ROOT)) {
            case "one" -> 1;
            case "two" -> 2;
            case "three" -> 3;
            case "four" -> 4;
            case "five" -> 5;
            case "six" -> 6;
            case "seven" -> 7;
            case "eight" -> 8;
            case "nine" -> 9;
            case "ten" -> 10;
            default -> Integer.parseInt(value);
        };
    }

    private boolean isHeading(Element element) {
        return element.tagName().matches("h[2-5]");
    }

    private Element mainContent(Document document) {
        List<String> selectors = List.of(
                "main",
                "#content",
                "#contentarea",
                "#textcontainer",
                ".page_content",
                ".page-content",
                ".content"
        );

        return selectors.stream()
                .map(document::select)
                .flatMap(Elements::stream)
                .filter(element -> element.selectFirst("h1") != null || element.text().contains("Course List"))
                .max((left, right) -> Integer.compare(left.text().length(), right.text().length()))
                .orElse(document.body());
    }

    private Element cleaned(Element element) {
        Element clone = element.clone();
        clone.select("script, style, noscript, nav, header, footer, form, .search, .print, #print-dialog, .sidebar, #sidebar, #navigation").remove();
        return clone;
    }

    private String plainText(Element element) {
        StringBuilder text = new StringBuilder();
        appendText(element, text);
        return text.toString()
                .replace('\u00a0', ' ')
                .replaceAll("[\\t\\x0B\\f\\r]+", " ")
                .replaceAll(" *\\n *", "\n")
                .replaceAll("\\n{3,}", "\n\n")
                .trim();
    }

    private void appendText(Node node, StringBuilder text) {
        if (node instanceof TextNode textNode) {
            text.append(textNode.text());
            return;
        }

        if (!(node instanceof Element element)) {
            for (Node child : node.childNodes()) {
                appendText(child, text);
            }
            return;
        }

        String tag = element.tagName();
        boolean block = tag.matches("h[1-6]|p|li|tr|table|ul|ol|div|section|article");
        if (block && !text.isEmpty() && text.charAt(text.length() - 1) != '\n') {
            text.append('\n');
        }

        if (tag.equals("br")) {
            text.append('\n');
        }

        for (Node child : element.childNodes()) {
            appendText(child, text);
            if (tag.equals("td") || tag.equals("th")) {
                text.append(' ');
            }
        }

        if (block && !text.isEmpty() && text.charAt(text.length() - 1) != '\n') {
            text.append('\n');
        }
    }

    private String normalizeWhitespace(String value) {
        return value == null
                ? ""
                : value.replace('\u00a0', ' ')
                .replaceAll("\\s+", " ")
                .trim();
    }

    private Optional<String> firstText(Elements elements) {
        return elements.stream()
                .map(Element::text)
                .map(this::normalizeWhitespace)
                .filter(value -> !value.isBlank())
                .findFirst();
    }

    private Optional<String> catalogYear(Document document) {
        Matcher matcher = CATALOG_YEAR_PATTERN.matcher(document.text());
        return matcher.find() ? Optional.of(matcher.group(1)) : Optional.empty();
    }

    public record ParsedCatalogRequirement(
            String catalogTitle,
            String catalogYear,
            String rawRequirementsText,
            JsonNode structuredRequirements,
            List<String> parseWarnings
    ) {
    }
}
