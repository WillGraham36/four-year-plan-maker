package com.willgraham.four_year_planner.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.willgraham.four_year_planner.model.CurriculumProgramType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CatalogRequirementParserTest {
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final CatalogRequirementParser parser = new CatalogRequirementParser(objectMapper);

    @Test
    void parsesCourseRowsAndChooseGroupsFromCatalogTables() {
        String html = """
                <html>
                  <body>
                    <main>
                      <h1>Computer Science Minor</h1>
                      <p>2025-2026 Catalog</p>
                      <p>All courses must be completed with a grade of C- or better.</p>
                      <h2>Requirements</h2>
                      <table>
                        <tr><th>Course List</th><th>Course Title</th><th>Credits</th></tr>
                        <tr><td>CMSC132</td><td>Object-Oriented Programming II</td><td>4</td></tr>
                        <tr><td>CMSC216</td><td>Introduction to Computer Systems</td><td>4</td></tr>
                        <tr><td>Select two of the following:</td><td></td><td>6</td></tr>
                        <tr><td>CMSC411</td><td>Computer Systems Architecture</td><td></td></tr>
                        <tr><td>Total Credits</td><td></td><td>24</td></tr>
                      </table>
                    </main>
                  </body>
                </html>
                """;

        CatalogRequirementParser.ParsedCatalogRequirement parsed = parser.parse(
                html,
                "https://academiccatalog.umd.edu/example/",
                "Computer Science Minor",
                CurriculumProgramType.MINOR
        );

        JsonNode structured = parsed.structuredRequirements();
        JsonNode rows = structured.get("groups").get(0).get("rows");

        assertEquals("curriculum.requirements.ai.v1", structured.get("schemaVersion").asText());
        assertEquals("2025-2026", parsed.catalogYear());
        assertTrue(parsed.rawRequirementsText().contains("All courses must be completed"));
        assertFalse(structured.has("rawText"));
        assertFalse(structured.has("sections"));
        assertFalse(structured.has("requirementGroups"));
        assertFalse(structured.get("groups").get(0).has("sourceText"));
        assertFalse(rows.get(0).has("rawText"));
        assertTrue(structured.get("policyNotes").get(0).get("text").asText().contains("C- or better"));
        assertEquals("course", rows.get(0).get("type").asText());
        assertEquals("CMSC132", rows.get(0).get("courseIds").get(0).asText());
        assertEquals("choose_n", rows.get(2).get("type").asText());
        assertEquals(2, rows.get(2).get("selectionRule").get("minCourses").asInt());
        assertEquals("24", rows.get(4).get("credits").asText());
        assertTrue(structured.get("courseIndex").toString().contains("CMSC411"));
        assertTrue(serializedLength(structured) < serializedLength(legacyLikeShape(parsed, structured)) / 2);
    }

    private int serializedLength(JsonNode jsonNode) {
        try {
            return objectMapper.writeValueAsString(jsonNode).length();
        } catch (Exception e) {
            throw new AssertionError(e);
        }
    }

    private JsonNode legacyLikeShape(CatalogRequirementParser.ParsedCatalogRequirement parsed, JsonNode structured) {
        ObjectNode legacy = objectMapper.createObjectNode();
        legacy.put("schemaVersion", "curriculum.requirements.v1");
        legacy.put("rawText", parsed.rawRequirementsText());
        legacy.set("sections", objectMapper.createArrayNode()
                .add(objectMapper.createObjectNode()
                        .put("heading", "Requirements")
                        .set("tables", objectMapper.createArrayNode()
                                .add(objectMapper.createObjectNode()
                                        .put("sourceText", parsed.rawRequirementsText())
                                        .set("rows", structured.get("groups").get(0).get("rows"))))));
        legacy.set("requirementGroups", objectMapper.createArrayNode()
                .add(objectMapper.createObjectNode()
                        .put("sourceText", parsed.rawRequirementsText())
                        .set("rows", structured.get("groups").get(0).get("rows"))));
        return legacy;
    }
}
