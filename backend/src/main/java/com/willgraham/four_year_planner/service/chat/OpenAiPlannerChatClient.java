package com.willgraham.four_year_planner.service.chat;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.willgraham.four_year_planner.dto.chat.PlannerChatIntentDto;
import com.willgraham.four_year_planner.dto.chat.PlannerChatMessageDto;
import com.willgraham.four_year_planner.dto.chat.PlannerChatRetrievalDto;
import com.willgraham.four_year_planner.exception.InvalidInputException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class OpenAiPlannerChatClient {
    private static final String INTENT_SYSTEM_PROMPT = """
            You parse UMD four-year planner chat messages into structured JSON only.
            Do not make academic decisions. Do not invent course IDs or requirements.
            Extract only user intent and useful filters for backend validation.
            Use UNKNOWN when the request is outside course planning.
            """;

    private static final String RESPONSE_SYSTEM_PROMPT = """
            You are TerpPlanner's planning assistant.
            Answer only from the verified backend data supplied in retrievedData.
            Do not invent courses, prerequisites, policies, or requirement status.
            If retrievedData is insufficient, say what data is missing and suggest a safe next step.
            Keep advice non-authoritative and encourage official advisor/catalog confirmation for decisions.
            """;

    private final ObjectMapper objectMapper;
    private final RestClient restClient;
    private final String apiKey;
    private final String model;

    public OpenAiPlannerChatClient(
            ObjectMapper objectMapper,
            RestClient.Builder restClientBuilder,
            @Value("${openai.api.base-url:https://api.openai.com/v1}") String baseUrl,
            @Value("${openai.api.key:}") String configuredApiKey,
            @Value("${openai.model:gpt-5.4-nano}") String configuredModel
    ) {
        this.objectMapper = objectMapper;
        this.apiKey = firstNonBlank(configuredApiKey, readBackendEnv("OPENAI_API_KEY")).orElse("");
        this.model = firstNonBlank(readBackendEnv("OPENAI_MODEL"), configuredModel).orElse("gpt-5.4-nano");
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public PlannerChatIntentDto parseIntent(String message, List<PlannerChatMessageDto> conversation) {
        JsonNode response = createResponse(Map.of(
                "model", model,
                "input", List.of(
                        Map.of("role", "system", "content", INTENT_SYSTEM_PROMPT),
                        Map.of("role", "user", "content", buildIntentInput(message, conversation))
                ),
                "text", Map.of("format", intentJsonSchema()),
                "max_output_tokens", 700
        ));

        String outputText = extractOutputText(response);
        try {
            return objectMapper.readValue(outputText, PlannerChatIntentDto.class);
        } catch (JsonProcessingException e) {
            throw new InvalidInputException("AI returned invalid intent JSON");
        }
    }

    public String generateResponse(
            String message,
            PlannerChatIntentDto intent,
            PlannerChatRetrievalDto retrievedData,
            List<PlannerChatMessageDto> conversation
    ) {
        JsonNode response = createResponse(Map.of(
                "model", model,
                "input", List.of(
                        Map.of("role", "system", "content", RESPONSE_SYSTEM_PROMPT),
                        Map.of("role", "user", "content", buildResponseInput(message, intent, retrievedData, conversation))
                ),
                "max_output_tokens", 900
        ));
        return extractOutputText(response);
    }

    private JsonNode createResponse(Map<String, Object> body) {
        if (!isConfigured()) {
            throw new InvalidInputException("OpenAI API key is not configured");
        }

        return restClient.post()
                .uri("/responses")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(JsonNode.class);
    }

    private String buildIntentInput(String message, List<PlannerChatMessageDto> conversation) {
        return """
                Current user message:
                %s

                Recent conversation:
                %s
                """.formatted(message, serialize(conversation == null ? List.of() : conversation));
    }

    private String buildResponseInput(
            String message,
            PlannerChatIntentDto intent,
            PlannerChatRetrievalDto retrievedData,
            List<PlannerChatMessageDto> conversation
    ) {
        return """
                Current user message:
                %s

                Validated intent:
                %s

                Retrieved backend data:
                %s

                Recent conversation:
                %s
                """.formatted(
                message,
                serialize(intent),
                serialize(retrievedData),
                serialize(conversation == null ? List.of() : conversation)
        );
    }

    private Map<String, Object> intentJsonSchema() {
        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        schema.put("additionalProperties", false);
        schema.put("required", List.of(
                "intent",
                "query",
                "courseIds",
                "departments",
                "genEds",
                "requirementKeywords",
                "programNames",
                "limit"
        ));
        schema.put("properties", Map.of(
                "intent", Map.of(
                        "type", "string",
                        "enum", List.of(
                                "SEARCH_COURSES",
                                "RECOMMEND_COURSES",
                                "EXPLAIN_REMAINING_REQUIREMENTS",
                                "DEGREE_PROGRESS",
                                "REQUIREMENT_COURSES",
                                "PLANNING_QUESTION",
                                "UNKNOWN"
                        )
                ),
                "query", Map.of("type", "string"),
                "courseIds", arrayOfStrings(),
                "departments", arrayOfStrings(),
                "genEds", arrayOfStrings(),
                "requirementKeywords", arrayOfStrings(),
                "programNames", arrayOfStrings(),
                "limit", Map.of("type", "integer")
        ));

        return Map.of(
                "type", "json_schema",
                "name", "planner_chat_intent",
                "strict", true,
                "schema", schema
        );
    }

    private Map<String, Object> arrayOfStrings() {
        return Map.of(
                "type", "array",
                "items", Map.of("type", "string")
        );
    }

    private String extractOutputText(JsonNode response) {
        if (response == null) {
            throw new InvalidInputException("OpenAI returned an empty response");
        }

        JsonNode outputText = response.get("output_text");
        if (outputText != null && outputText.isTextual()) {
            return outputText.asText();
        }

        StringBuilder text = new StringBuilder();
        JsonNode output = response.get("output");
        if (output != null && output.isArray()) {
            for (JsonNode item : output) {
                JsonNode content = item.get("content");
                if (content == null || !content.isArray()) {
                    continue;
                }
                for (JsonNode contentItem : content) {
                    JsonNode textNode = contentItem.get("text");
                    if (textNode != null && textNode.isTextual()) {
                        text.append(textNode.asText());
                    }
                }
            }
        }

        if (text.length() == 0) {
            throw new InvalidInputException("OpenAI returned no response text");
        }
        return text.toString();
    }

    private String serialize(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new InvalidInputException("Could not serialize chat context");
        }
    }

    private Optional<String> firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return Optional.of(first);
        }
        if (second != null && !second.isBlank()) {
            return Optional.of(second);
        }
        return Optional.empty();
    }

    private String readBackendEnv(String key) {
        for (Path path : List.of(Path.of(".env"), Path.of("backend", ".env"))) {
            if (!Files.isRegularFile(path)) {
                continue;
            }
            try {
                for (String line : Files.readAllLines(path)) {
                    String trimmed = line.trim();
                    if (trimmed.startsWith(key + "=")) {
                        return trimmed.substring((key + "=").length()).trim();
                    }
                }
            } catch (IOException ignored) {
                return "";
            }
        }
        return "";
    }
}
