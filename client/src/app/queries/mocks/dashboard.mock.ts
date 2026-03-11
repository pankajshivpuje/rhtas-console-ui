import dayjs from "dayjs";

import type { PostureSummary, PostureTrendPoint, UnsignedArtifact } from "@app/client";

const postureSummaryByEnv: Record<string, PostureSummary> = {
  all: {
    totalArtifacts: 142,
    signedCount: 124,
    unsignedCount: 5,
    partiallySignedCount: 13,
    signedPercentage: 87.3,
    attestationCoverage: 92.1,
  },
  "rhtas-production": {
    totalArtifacts: 58,
    signedCount: 55,
    unsignedCount: 2,
    partiallySignedCount: 1,
    signedPercentage: 94.8,
    attestationCoverage: 96.5,
  },
  "rhtas-staging": {
    totalArtifacts: 41,
    signedCount: 35,
    unsignedCount: 1,
    partiallySignedCount: 5,
    signedPercentage: 85.4,
    attestationCoverage: 90.2,
  },
  "rhtas-dev": {
    totalArtifacts: 29,
    signedCount: 22,
    unsignedCount: 2,
    partiallySignedCount: 5,
    signedPercentage: 75.9,
    attestationCoverage: 82.8,
  },
  "trusted-artifact-signer": {
    totalArtifacts: 14,
    signedCount: 12,
    unsignedCount: 0,
    partiallySignedCount: 2,
    signedPercentage: 85.7,
    attestationCoverage: 92.9,
  },
};

export const getPostureSummaryMock = (env?: string): PostureSummary =>
  postureSummaryByEnv[env ?? "all"] ?? postureSummaryByEnv["all"];

export const postureSummaryMock: PostureSummary = postureSummaryByEnv["all"];

const allUnsignedArtifacts: UnsignedArtifact[] = [
  {
    uri: "quay.io/myorg/billing-service:1.4.2",
    environment: "rhtas-production",
    lastSeen: "2026-03-09T14:22:00Z",
    registry: "quay.io",
  },
  {
    uri: "quay.io/myorg/auth-proxy:2.0.1",
    environment: "rhtas-production",
    lastSeen: "2026-03-08T09:15:00Z",
    registry: "quay.io",
  },
  {
    uri: "registry.example.com/frontend:3.1.0-rc1",
    environment: "rhtas-staging",
    lastSeen: "2026-03-09T18:45:00Z",
    registry: "registry.example.com",
  },
  {
    uri: "registry.example.com/data-pipeline:0.9.0",
    environment: "rhtas-dev",
    lastSeen: "2026-03-07T11:30:00Z",
    registry: "registry.example.com",
  },
  {
    uri: "ghcr.io/myorg/monitoring-agent:latest",
    environment: "rhtas-dev",
    lastSeen: "2026-03-06T16:00:00Z",
    registry: "ghcr.io",
  },
];

export const getUnsignedArtifactsMock = (env?: string): { data: UnsignedArtifact[] } => ({
  data: env ? allUnsignedArtifacts.filter((a) => a.environment === env) : allUnsignedArtifacts,
});

export const unsignedArtifactsMock: { data: UnsignedArtifact[] } = { data: allUnsignedArtifacts };

function generateTrendData(baseSignedPct = 82, baseAttestPct = 87, baseTotal = 130): PostureTrendPoint[] {
  const points: PostureTrendPoint[] = [];
  const now = dayjs();

  for (let i = 29; i >= 0; i--) {
    const date = now.subtract(i, "day");
    const base = baseSignedPct + (29 - i) * 0.2;
    const dip = i >= 4 && i <= 6 ? -2.5 : 0;
    const signedPct = Math.min(100, Math.round((base + dip) * 10) / 10);

    const attestBase = baseAttestPct + (29 - i) * 0.18;
    const attestDip = i >= 4 && i <= 6 ? -1.8 : 0;
    const attestPct = Math.min(100, Math.round((attestBase + attestDip) * 10) / 10);

    points.push({
      date: date.format("YYYY-MM-DD"),
      signedPercentage: signedPct,
      attestationPercentage: attestPct,
      totalArtifacts: baseTotal + Math.floor((29 - i) * 0.4),
    });
  }

  return points;
}

const trendByEnv: Record<string, PostureTrendPoint[]> = {
  all: generateTrendData(82, 87, 130),
  "rhtas-production": generateTrendData(90, 93, 52),
  "rhtas-staging": generateTrendData(80, 85, 36),
  "rhtas-dev": generateTrendData(70, 78, 24),
  "trusted-artifact-signer": generateTrendData(82, 89, 12),
};

export const getPostureTrendMock = (env?: string): { data: PostureTrendPoint[] } => ({
  data: trendByEnv[env ?? "all"] ?? trendByEnv["all"],
});

export const postureTrendMock: { data: PostureTrendPoint[] } = {
  data: trendByEnv["all"],
};
