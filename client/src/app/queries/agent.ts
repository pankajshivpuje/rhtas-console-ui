import type { AxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";

import ENV from "@app/env";
import { client } from "@app/axios-config/apiInit";
import {
  getAgentInsights,
  getAgentInsightsSummary,
  postAgentChat,
  type AgentInsight,
  type AgentSummary,
  type ChatMessage,
  type Error as ApiError,
} from "@app/client";

import { useMockableQuery } from "./helpers";
import { agentInsightsMock, agentSummaryMock, generateAgentResponse } from "./mocks/agent.mock";

export const AgentKeys = {
  insights: ["Agent", "insights"] as const,
  insightSummary: ["Agent", "insights", "summary"] as const,
};

export const useFetchInsights = () => {
  const { data, isLoading, error } = useMockableQuery<AgentInsight[], AxiosError<ApiError>>(
    {
      queryKey: AgentKeys.insights,
      queryFn: async () => {
        const response = await getAgentInsights({ client });
        return response.data ?? [];
      },
      refetchInterval: 60000,
    },
    agentInsightsMock
  );

  return {
    insights: data ?? [],
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useFetchInsightSummary = () => {
  const { data, isLoading, error } = useMockableQuery<AgentSummary, AxiosError<ApiError>>(
    {
      queryKey: AgentKeys.insightSummary,
      queryFn: async () => {
        const response = await getAgentInsightsSummary({ client });
        return response.data!;
      },
      refetchInterval: 60000,
    },
    agentSummaryMock
  );

  return {
    summary: data,
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useSendChatMessage = () => {
  const mutation = useMutation<ChatMessage, AxiosError<ApiError>, { message: string }>({
    mutationFn: async ({ message }) => {
      if (ENV.MOCK !== "off") {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return generateAgentResponse(message);
      }
      const response = await postAgentChat({
        client,
        body: { message },
      });
      return response.data!;
    },
  });

  return {
    sendMessage: mutation.mutate,
    data: mutation.data,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};
