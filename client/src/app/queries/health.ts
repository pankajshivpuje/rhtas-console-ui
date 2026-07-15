import type { AxiosError } from "axios";

import { client } from "@app/axios-config/apiInit";
import {
  getHealthz,
  getApiV1TrustConfig,
  getApiV1TrustRootMetadataInfo,
  getApiV1RekorPublicKey,
  type Error as ApiError,
} from "@app/client";

import { useMockableQuery } from "./helpers";
import {
  serviceHealthMock,
  expiringAssetsMock,
  errorRateMock,
  incidentsMock,
  type ServiceHealthStatus,
  type ExpiringTrustAsset,
  type ErrorRateData,
  type IncidentEvent,
} from "./mocks/health.mock";

export type {
  ServiceHealthStatus,
  ServiceDetail,
  ServiceStatus,
  ServiceDrillDown,
  ProbeStatus,
  CertChainItem,
  FailingCheck,
  ExpiringTrustAsset,
  ErrorRateData,
  IncidentEvent,
} from "./mocks/health.mock";

export const HealthKeys = {
  serviceStatus: ["Health", "service-status"],
  expiringAssets: ["Health", "expiring-assets"],
  errorRate: ["Health", "error-rate"],
  incidents: ["Health", "incidents"],
};

export const useFetchServiceHealth = () => {
  const { data, isLoading, error } = useMockableQuery<ServiceHealthStatus, AxiosError<ApiError>>(
    {
      queryKey: HealthKeys.serviceStatus,
      queryFn: async () => {
        const [backend, fulcio, tuf, rekor] = await Promise.allSettled([
          getHealthz({ client }),
          getApiV1TrustConfig({ client }),
          getApiV1TrustRootMetadataInfo({ client }),
          getApiV1RekorPublicKey({ client }),
        ]);

        const toStatus = (r: PromiseSettledResult<unknown>) => (r.status === "fulfilled" ? "healthy" : "down");

        return {
          overall: [backend, fulcio, tuf, rekor].every((r) => r.status === "fulfilled")
            ? "operational"
            : [backend, fulcio, tuf, rekor].some((r) => r.status === "rejected")
              ? "down"
              : "degraded",
          overallMessage: "Service status",
          overallDescription: "",
          services: [
            {
              name: "Cosign",
              status: toStatus(backend),
              statusText: toStatus(backend) === "healthy" ? "Healthy" : "Down",
              detail: "",
              drillDown: {
                endpoint: "",
                impactMessage: "",
                lastSuccessfulProbe: "",
                consecutiveFailures: 0,
                probeHistory: [],
                failingChecks: [],
              },
            },
            {
              name: "Fulcio",
              status: toStatus(fulcio),
              statusText: toStatus(fulcio) === "healthy" ? "Healthy" : "Down",
              detail: "",
              drillDown: {
                endpoint: "",
                impactMessage: "",
                lastSuccessfulProbe: "",
                consecutiveFailures: 0,
                probeHistory: [],
                failingChecks: [],
              },
            },
            {
              name: "Rekor",
              status: toStatus(rekor),
              statusText: toStatus(rekor) === "healthy" ? "Healthy" : "Down",
              detail: "",
              drillDown: {
                endpoint: "",
                impactMessage: "",
                lastSuccessfulProbe: "",
                consecutiveFailures: 0,
                probeHistory: [],
                failingChecks: [],
              },
            },
            {
              name: "TUF",
              status: toStatus(tuf),
              statusText: toStatus(tuf) === "healthy" ? "Healthy" : "Down",
              detail: "",
              drillDown: {
                endpoint: "",
                impactMessage: "",
                lastSuccessfulProbe: "",
                consecutiveFailures: 0,
                probeHistory: [],
                failingChecks: [],
              },
            },
          ],
        } satisfies ServiceHealthStatus;
      },
      refetchInterval: 60000,
    },
    serviceHealthMock
  );

  return {
    serviceHealth: data,
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useFetchExpiringAssets = () => {
  const { data, isLoading, error } = useMockableQuery<ExpiringTrustAsset[], AxiosError<ApiError>>(
    {
      queryKey: HealthKeys.expiringAssets,
      queryFn: async () => [],
    },
    expiringAssetsMock
  );

  return {
    expiringAssets: data ?? [],
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useFetchErrorRate = () => {
  const { data, isLoading, error } = useMockableQuery<ErrorRateData, AxiosError<ApiError>>(
    {
      queryKey: HealthKeys.errorRate,
      queryFn: async () => ({ totalErrors: 0, errorRate: 0, breakdown: [] }),
    },
    errorRateMock
  );

  return {
    errorRate: data,
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useFetchIncidents = () => {
  const { data, isLoading, error } = useMockableQuery<IncidentEvent[], AxiosError<ApiError>>(
    {
      queryKey: HealthKeys.incidents,
      queryFn: async () => [],
    },
    incidentsMock
  );

  return {
    incidents: data ?? [],
    isFetching: isLoading,
    fetchError: error,
  };
};
