import type { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import ENV from "@app/env";
import { useMockHealth } from "@app/components/mockHealthContext";
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
import {
  alertListResponseMock,
  alertSummaryMock,
  getMockAlertList,
  getMockAlertSummary,
  getScenarioAlerts,
} from "./mocks/alerts.mock";

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
  const { scenario, acknowledgedAlerts } = useMockHealth();
  const { data, isLoading, error } = useMockableQuery<AlertListResponse, AxiosError<ApiError>>(
    {
      queryKey: AlertKeys.list(filters),
      queryFn: async () => {
        const response = await getAlerts({ client, query: filters });
        return response.data!;
      },
      refetchInterval: 30000,
    },
    alertListResponseMock
  );
  const result =
    ENV.MOCK !== "off" && data ? getMockAlertList(getScenarioAlerts(scenario, acknowledgedAlerts), filters) : data;

  return {
    alerts: result?.data ?? [],
    total: result?.total ?? 0,
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useFetchAlertSummary = () => {
  const { scenario, acknowledgedAlerts } = useMockHealth();
  const { data, isLoading, error } = useMockableQuery<AlertSummary, AxiosError<ApiError>>(
    {
      queryKey: AlertKeys.summary,
      queryFn: async () => {
        const response = await getAlertSummary({ client });
        return response.data!;
      },
      refetchInterval: 30000,
    },
    alertSummaryMock
  );

  return {
    alertSummary:
      ENV.MOCK !== "off" && data ? getMockAlertSummary(getScenarioAlerts(scenario, acknowledgedAlerts)) : data,
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient();
  const { scenario, acknowledgedAlerts, acknowledgeAlert: acknowledgeMockAlert } = useMockHealth();

  const mutation = useMutation<Alert, AxiosError<ApiError>, string>({
    mutationFn: async (alertId: string) => {
      if (ENV.MOCK !== "off") {
        const mockAlert = getScenarioAlerts(scenario, acknowledgedAlerts).find((alert) => alert.id === alertId);
        if (!mockAlert) throw new Error("Alert not found");
        return {
          ...mockAlert,
          id: alertId,
          acknowledged: true,
          acknowledgedBy: "user",
          acknowledgedAt: new Date().toISOString(),
        } as Alert;
      }
      const response = await acknowledgeAlert({
        client,
        path: { alertId },
        body: { acknowledged: true },
      });
      return response.data!;
    },
    onSuccess: (updatedAlert) => {
      if (ENV.MOCK !== "off") {
        acknowledgeMockAlert(updatedAlert.id, updatedAlert.acknowledgedAt ?? new Date().toISOString());
        return;
      }
      queryClient.setQueriesData<AlertListResponse>({ queryKey: ["Alerts", "list"] }, (old) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((a) => (a.id === updatedAlert.id ? updatedAlert : a)) };
      });
      void queryClient.invalidateQueries({ queryKey: AlertKeys.summary });
    },
  });

  return {
    acknowledge: (alertId: string) => mutation.mutateAsync(alertId),
    isAcknowledging: mutation.isPending,
  };
};
