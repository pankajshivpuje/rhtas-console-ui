import type { AxiosError } from "axios";

import { client } from "@app/axios-config/apiInit";
import {
  getAttestationCoverage,
  getPostureSummary,
  getPostureTrend,
  getUnsignedArtifacts,
  type AttestationTypeCoverage,
  type Error as ApiError,
  type PostureSummary,
  type PostureTrendPoint,
  type UnsignedArtifact,
} from "@app/client";

import { useMockableQuery } from "./helpers";
import {
  getAttestationCoverageMock,
  getPostureSummaryMock,
  getPostureTrendMock,
  getUnsignedArtifactsMock,
} from "./mocks/dashboard.mock";

export const DashboardKeys = {
  postureSummary: (env?: string) => ["Dashboard", "posture-summary", env ?? "all"],
  unsignedArtifacts: (env?: string) => ["Dashboard", "unsigned-artifacts", env ?? "all"],
  postureTrend: (days: number, env?: string) => ["Dashboard", "posture-trend", days, env ?? "all"],
  attestationCoverage: (env?: string) => ["Dashboard", "attestation-coverage", env ?? "all"],
};

export const useFetchPostureSummary = ({ environment }: { environment?: string } = {}) => {
  const { data, isLoading, error } = useMockableQuery<PostureSummary | null, AxiosError<ApiError>>(
    {
      queryKey: DashboardKeys.postureSummary(environment),
      queryFn: async () => {
        const response = await getPostureSummary({ client, query: { environment } });
        return response.data ?? null;
      },
    },
    getPostureSummaryMock(environment)
  );

  return {
    summary: data,
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useFetchUnsignedArtifacts = ({ environment }: { environment?: string } = {}) => {
  const { data, isLoading, error } = useMockableQuery<{ data: UnsignedArtifact[] } | null, AxiosError<ApiError>>(
    {
      queryKey: DashboardKeys.unsignedArtifacts(environment),
      queryFn: async () => {
        const response = await getUnsignedArtifacts({
          client,
          query: { environment },
        });
        return response.data ?? null;
      },
    },
    getUnsignedArtifactsMock(environment)
  );

  return {
    unsignedArtifacts: data?.data ?? [],
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useFetchPostureTrend = ({ days = 30, environment }: { days?: number; environment?: string } = {}) => {
  const { data, isLoading, error } = useMockableQuery<{ data: PostureTrendPoint[] } | null, AxiosError<ApiError>>(
    {
      queryKey: DashboardKeys.postureTrend(days, environment),
      queryFn: async () => {
        const response = await getPostureTrend({
          client,
          query: { days, environment },
        });
        return response.data ?? null;
      },
    },
    getPostureTrendMock(environment)
  );

  return {
    trend: data?.data ?? [],
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useFetchAttestationCoverage = ({ environment }: { environment?: string } = {}) => {
  const { data, isLoading, error } = useMockableQuery<{ data: AttestationTypeCoverage[] } | null, AxiosError<ApiError>>(
    {
      queryKey: DashboardKeys.attestationCoverage(environment),
      queryFn: async () => {
        const response = await getAttestationCoverage({
          client,
          query: { environment },
        });
        return response.data ?? null;
      },
    },
    getAttestationCoverageMock(environment)
  );

  return {
    attestationCoverage: data?.data ?? [],
    isFetching: isLoading,
    fetchError: error,
  };
};
