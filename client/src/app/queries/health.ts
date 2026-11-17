import type { AxiosError } from "axios";

import { client } from "@app/axios-config/apiInit";
import {
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
  all: ["Health"],
  serviceStatus: ["Health", "service-status"],
  expiringAssets: ["Health", "expiring-assets"],
  errorRate: ["Health", "error-rate"],
  incidents: ["Health", "incidents"],
};

export const useFetchServiceHealth = () => {
  const { data, isLoading, isFetching, dataUpdatedAt, error } = useMockableQuery<
    ServiceHealthStatus,
    AxiosError<ApiError>
  >(
    {
      queryKey: HealthKeys.serviceStatus,
      queryFn: async () => {
        const [fulcio, tuf, rekor] = await Promise.allSettled([
          getApiV1TrustConfig({ client }),
          getApiV1TrustRootMetadataInfo({ client }),
          getApiV1RekorPublicKey({ client }),
        ]);

        const toStatus = (r: PromiseSettledResult<unknown>) => (r.status === "fulfilled" ? "healthy" : "down");

        // If none of the proxy checks returns data, the console API may itself be unavailable.
        if ([fulcio, tuf, rekor].every((result) => result.status === "rejected")) {
          throw new Error("Unable to retrieve service health");
        }

        return {
          services: [
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
    isRefreshing: isFetching,
    dataUpdatedAt,
    fetchError: error,
  };
};

export const useFetchExpiringAssets = () => {
  const { data, isLoading, error } = useMockableQuery<ExpiringTrustAsset[], AxiosError<ApiError>>(
    {
      queryKey: HealthKeys.expiringAssets,
      queryFn: () => Promise.resolve([]),
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
      queryFn: () => Promise.resolve({ totalErrors: 0, errorRate: 0, breakdown: [] }),
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
      queryFn: () => Promise.resolve([]),
    },
    incidentsMock
  );

  return {
    incidents: data ?? [],
    isFetching: isLoading,
    fetchError: error,
  };
};
