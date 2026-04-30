import type { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import ENV from "@app/env";
import { client } from "@app/axios-config/apiInit";
import {
  getAlerts,
  getAlertSummary,
  acknowledgeAlert,
  type Error as ApiError,
  type Alert,
  type AlertListResponse,
  type AlertSummary,
} from "@app/client";

import { useMockableQuery } from "./helpers";
import { alertListResponseMock, alertSummaryMock, alertsMock } from "./mocks/alerts.mock";

export type { Alert, AlertListResponse, AlertSummary } from "@app/client";

export interface AlertFilters {
  status?: "firing" | "resolved";
  severity?: "critical" | "warning" | "info";
  acknowledged?: boolean;
  limit?: number;
  offset?: number;
}

export const AlertKeys = {
  all: ["Alerts" as const],
  list: (filters?: AlertFilters) => ["Alerts", "list", filters] as const,
  summary: ["Alerts", "summary"] as const,
};

export const useFetchAlerts = (filters?: AlertFilters) => {
  const { data, isLoading, error } = useMockableQuery<AlertListResponse, AxiosError<ApiError>>(
    {
      queryKey: AlertKeys.list(filters),
      queryFn: async () => {
        const response = await getAlerts({ client, query: filters });
        return response.data as AlertListResponse;
      },
      refetchInterval: 30000,
    },
    alertListResponseMock,
  );

  return {
    alerts: data?.data ?? [],
    total: data?.total ?? 0,
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useFetchAlertSummary = () => {
  const { data, isLoading, error } = useMockableQuery<AlertSummary, AxiosError<ApiError>>(
    {
      queryKey: AlertKeys.summary,
      queryFn: async () => {
        const response = await getAlertSummary({ client });
        return response.data as AlertSummary;
      },
      refetchInterval: 30000,
    },
    alertSummaryMock,
  );

  return {
    alertSummary: data,
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<Alert, AxiosError<ApiError>, string>({
    mutationFn: async (alertId: string) => {
      if (ENV.MOCK !== "off") {
        const mockAlert = alertsMock.find((a) => a.id === alertId) ?? alertsMock[0];
        return { ...mockAlert, id: alertId, acknowledged: true, acknowledgedBy: "user", acknowledgedAt: new Date().toISOString() } as Alert;
      }
      const response = await acknowledgeAlert({
        client,
        path: { alertId },
        body: { acknowledged: true },
      });
      return response.data as Alert;
    },
    onSuccess: (updatedAlert) => {
      queryClient.setQueriesData<AlertListResponse>({ queryKey: ["Alerts", "list"] }, (old) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((a) => (a.id === updatedAlert.id ? updatedAlert : a)) };
      });
      queryClient.invalidateQueries({ queryKey: AlertKeys.summary });
    },
  });

  return {
    acknowledge: (alertId: string) => mutation.mutateAsync(alertId),
    isAcknowledging: mutation.isPending,
  };
};
