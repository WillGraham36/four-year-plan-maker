package com.willgraham.four_year_planner.service.chat;

import com.willgraham.four_year_planner.dto.chat.PlannerChatIntentDto;
import com.willgraham.four_year_planner.dto.chat.PlannerChatRequestDto;
import com.willgraham.four_year_planner.dto.chat.PlannerChatResponseDto;
import com.willgraham.four_year_planner.dto.chat.PlannerChatRetrievalDto;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@AllArgsConstructor
@Service
public class PlannerChatService {
    private static final Logger logger = LoggerFactory.getLogger(PlannerChatService.class);

    private final OpenAiPlannerChatClient openAiPlannerChatClient;
    private final RuleBasedPlannerIntentParser ruleBasedPlannerIntentParser;
    private final PlannerChatIntentValidator intentValidator;
    private final PlannerChatRetrievalService retrievalService;
    private final PlannerChatFallbackResponseService fallbackResponseService;

    public PlannerChatResponseDto chat(String userId, PlannerChatRequestDto request) {
        PlannerChatIntentDto parsedIntent = parseIntent(request);
        PlannerChatIntentDto validatedIntent = intentValidator.validate(parsedIntent, request.message());
        logger.info("Planner chat intent validated: {}", validatedIntent);
        PlannerChatRetrievalDto retrievedData = retrievalService.retrieve(userId, validatedIntent);

        boolean aiEnabled = openAiPlannerChatClient.isConfigured();
        String responseMessage;
        if (aiEnabled) {
            try {
                logger.info("Planner chat generating OpenAI response");
                responseMessage = openAiPlannerChatClient.generateResponse(
                        request.message(),
                        validatedIntent,
                        retrievedData,
                        request.conversation()
                );
            } catch (RuntimeException e) {
                logger.warn("Planner chat OpenAI response failed; using fallback response", e);
                responseMessage = fallbackResponseService.generate(validatedIntent, retrievedData, true);
            }
        } else {
            logger.info("Planner chat OpenAI response disabled; using fallback response");
            responseMessage = fallbackResponseService.generate(validatedIntent, retrievedData, false);
        }

        return new PlannerChatResponseDto(responseMessage, validatedIntent, retrievedData, aiEnabled);
    }

    private PlannerChatIntentDto parseIntent(PlannerChatRequestDto request) {
        if (!openAiPlannerChatClient.isConfigured()) {
            logger.info("Planner chat OpenAI intent parsing disabled; using rule-based parser");
            return ruleBasedPlannerIntentParser.parse(request.message());
        }

        try {
            logger.info("Planner chat parsing intent with OpenAI");
            return openAiPlannerChatClient.parseIntent(request.message(), request.conversation());
        } catch (RuntimeException e) {
            logger.warn("Planner chat OpenAI intent parsing failed; using rule-based parser", e);
            return ruleBasedPlannerIntentParser.parse(request.message());
        }
    }
}
