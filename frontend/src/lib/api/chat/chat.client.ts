"use client";

import { useFetchWithAuth } from "@/hooks/useFetchWithAuthClient";
import { CustomServerResponse } from "@/lib/utils/types";

export type PlannerChatIntentType =
  | "SEARCH_COURSES"
  | "RECOMMEND_COURSES"
  | "EXPLAIN_REMAINING_REQUIREMENTS"
  | "DEGREE_PROGRESS"
  | "REQUIREMENT_COURSES"
  | "PLANNING_QUESTION"
  | "UNKNOWN";

export type PlannerChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type PlannerChatResponse = {
  message: string;
  intent: {
    intent: PlannerChatIntentType;
    query: string;
    courseIds: string[];
    departments: string[];
    genEds: string[];
    requirementKeywords: string[];
    programNames: string[];
    limit: number;
  };
  retrievedData: unknown;
  aiEnabled: boolean;
};

export function usePlannerChatApi() {
  const { fetchWithAuth } = useFetchWithAuth();

  const sendMessage = async (
    message: string,
    conversation: PlannerChatMessage[] = []
  ): Promise<CustomServerResponse<PlannerChatResponse>> => {
    return fetchWithAuth<PlannerChatResponse>("v1/chat", new URLSearchParams(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, conversation }),
    });
  };

  return { sendMessage };
}
