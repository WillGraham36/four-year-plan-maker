package com.willgraham.four_year_planner.service.chat;

import com.willgraham.four_year_planner.dto.chat.PlannerChatIntentDto;
import com.willgraham.four_year_planner.dto.chat.PlannerChatRequestDto;
import com.willgraham.four_year_planner.dto.chat.PlannerChatResponseDto;
import com.willgraham.four_year_planner.dto.chat.PlannerChatRetrievalDto;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@AllArgsConstructor
@Service
public class PlannerChatService {
    private final OpenAiPlannerChatClient openAiPlannerChatClient;
    private final RuleBasedPlannerIntentParser ruleBasedPlannerIntentParser;
    private final PlannerChatIntentValidator intentValidator;
    private final PlannerChatRetrievalService retrievalService;
    private final PlannerChatFallbackResponseService fallbackResponseService;

    public PlannerChatResponseDto chat(String userId, PlannerChatRequestDto request) {
        PlannerChatIntentDto parsedIntent = parseIntent(request);
        PlannerChatIntentDto validatedIntent = intentValidator.validate(parsedIntent, request.message());
        PlannerChatRetrievalDto retrievedData = retrievalService.retrieve(userId, validatedIntent);

        boolean aiEnabled = openAiPlannerChatClient.isConfigured();
        String responseMessage;
        if (aiEnabled) {
            try {
                responseMessage = openAiPlannerChatClient.generateResponse(
                        request.message(),
                        validatedIntent,
                        retrievedData,
                        request.conversation()
                );
            } catch (RuntimeException e) {
                responseMessage = fallbackResponseService.generate(validatedIntent, retrievedData, true);
            }
        } else {
            responseMessage = fallbackResponseService.generate(validatedIntent, retrievedData, false);
        }

        return new PlannerChatResponseDto(responseMessage, validatedIntent, retrievedData, aiEnabled);
    }

    private PlannerChatIntentDto parseIntent(PlannerChatRequestDto request) {
        if (!openAiPlannerChatClient.isConfigured()) {
            return ruleBasedPlannerIntentParser.parse(request.message());
        }

        try {
            return openAiPlannerChatClient.parseIntent(request.message(), request.conversation());
        } catch (RuntimeException e) {
            return ruleBasedPlannerIntentParser.parse(request.message());
        }
    }
}
