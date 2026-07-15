import dayjs from "dayjs";

import type { AttestationTypeCoverage, PostureSummary, PostureTrendPoint, SignedArtifact } from "@app/client";

const postureSummaryByEnv: Record<string, PostureSummary> = {
  all: {
    signedCount: 124,
    signedWithAttestationCount: 115,
    attestationCoverage: 92.7,
  },
  "rhtas-production": {
    signedCount: 55,
    signedWithAttestationCount: 53,
    attestationCoverage: 96.4,
  },
  "rhtas-staging": {
    signedCount: 35,
    signedWithAttestationCount: 31,
    attestationCoverage: 88.6,
  },
  "rhtas-dev": {
    signedCount: 22,
    signedWithAttestationCount: 19,
    attestationCoverage: 86.4,
  },
  "trusted-artifact-signer": {
    signedCount: 12,
    signedWithAttestationCount: 12,
    attestationCoverage: 100,
  },
};

export const getPostureSummaryMock = (env?: string): PostureSummary =>
  postureSummaryByEnv[env ?? "all"] ?? postureSummaryByEnv.all;

export const postureSummaryMock: PostureSummary = postureSummaryByEnv.all;

export const allSignedArtifacts: SignedArtifact[] = [
  {
    uri: "quay.io/myorg/api-server:2.3.1",
    environment: "rhtas-production",
    lastSeen: "2026-03-09T14:22:00Z",
    registry: "quay.io",
    hasAttestation: true,
    attestationTypes: ["https://slsa.dev/provenance/v1", "https://spdx.dev/Document/v2.3"],
  },
  {
    uri: "quay.io/myorg/billing-service:1.4.2",
    environment: "rhtas-production",
    lastSeen: "2026-03-09T12:10:00Z",
    registry: "quay.io",
    hasAttestation: true,
    attestationTypes: ["https://slsa.dev/provenance/v1"],
  },
  {
    uri: "quay.io/myorg/auth-proxy:2.0.1",
    environment: "rhtas-production",
    lastSeen: "2026-03-08T09:15:00Z",
    registry: "quay.io",
    hasAttestation: false,
  },
  {
    uri: "quay.io/myorg/gateway:4.1.0",
    environment: "rhtas-production",
    lastSeen: "2026-03-09T16:30:00Z",
    registry: "quay.io",
    hasAttestation: true,
    attestationTypes: [
      "https://slsa.dev/provenance/v1",
      "https://spdx.dev/Document/v2.3",
      "https://in-toto.io/attestation/vulns/v0.1",
    ],
  },
  {
    uri: "registry.example.com/frontend:3.1.0",
    environment: "rhtas-staging",
    lastSeen: "2026-03-09T18:45:00Z",
    registry: "registry.example.com",
    hasAttestation: true,
    attestationTypes: ["https://slsa.dev/provenance/v1"],
  },
  {
    uri: "registry.example.com/worker:1.2.0-rc1",
    environment: "rhtas-staging",
    lastSeen: "2026-03-08T22:00:00Z",
    registry: "registry.example.com",
    hasAttestation: false,
  },
  {
    uri: "registry.example.com/data-pipeline:0.9.0",
    environment: "rhtas-dev",
    lastSeen: "2026-03-07T11:30:00Z",
    registry: "registry.example.com",
    hasAttestation: true,
    attestationTypes: ["https://slsa.dev/provenance/v1", "https://spdx.dev/Document/v2.3"],
  },
  {
    uri: "ghcr.io/myorg/monitoring-agent:1.1.0",
    environment: "rhtas-dev",
    lastSeen: "2026-03-06T16:00:00Z",
    registry: "ghcr.io",
    hasAttestation: false,
  },
  {
    uri: "quay.io/myorg/notification-svc:3.0.2",
    environment: "rhtas-production",
    lastSeen: "2026-03-09T08:00:00Z",
    registry: "quay.io",
    hasAttestation: true,
    attestationTypes: ["https://slsa.dev/provenance/v1", "https://spdx.dev/Document/v2.3"],
  },
  {
    uri: "quay.io/myorg/cache-proxy:1.0.5",
    environment: "rhtas-staging",
    lastSeen: "2026-03-09T10:00:00Z",
    registry: "quay.io",
    hasAttestation: true,
    attestationTypes: ["https://slsa.dev/provenance/v1"],
  },
];

export const getSignedArtifactsMock = (env?: string, filter?: string): { data: SignedArtifact[] } => {
  let filtered = env ? allSignedArtifacts.filter((a) => a.environment === env) : allSignedArtifacts;

  if (filter === "signed-only") {
    filtered = filtered.filter((a) => !a.hasAttestation);
  } else if (filter === "signed-with-attestation") {
    filtered = filtered.filter((a) => a.hasAttestation);
  }

  return { data: filtered };
};

function generateTrendData(baseSigned = 110, baseWithAttestation = 95): PostureTrendPoint[] {
  const points: PostureTrendPoint[] = [];
  const now = dayjs();

  for (let i = 29; i >= 0; i--) {
    const date = now.subtract(i, "day");
    const signedCount = baseSigned + Math.floor((29 - i) * 0.5);
    const dip = i >= 4 && i <= 6 ? -3 : 0;
    const withAttestation = Math.min(signedCount, baseWithAttestation + Math.floor((29 - i) * 0.45) + dip);

    points.push({
      date: date.format("YYYY-MM-DD"),
      signedCount,
      signedWithAttestationCount: withAttestation,
    });
  }

  return points;
}

const trendByEnv: Record<string, PostureTrendPoint[]> = {
  all: generateTrendData(110, 95),
  "rhtas-production": generateTrendData(48, 45),
  "rhtas-staging": generateTrendData(30, 25),
  "rhtas-dev": generateTrendData(18, 14),
  "trusted-artifact-signer": generateTrendData(10, 10),
};

export const getPostureTrendMock = (env?: string): { data: PostureTrendPoint[] } => ({
  data: trendByEnv[env ?? "all"] ?? trendByEnv.all,
});

export const postureTrendMock: { data: PostureTrendPoint[] } = {
  data: trendByEnv.all,
};

function buildAttestationCoverage(
  signedTotal: number,
  coverages: [string, string, number][]
): AttestationTypeCoverage[] {
  return coverages.map(([attestationType, displayName, artifactCount]) => ({
    attestationType,
    displayName,
    artifactCount,
    signedArtifacts: signedTotal,
    percentage: Math.round((artifactCount / signedTotal) * 1000) / 10,
  }));
}

const attestationCoverageByEnv: Record<string, AttestationTypeCoverage[]> = {
  all: buildAttestationCoverage(124, [
    ["https://slsa.dev/provenance/v1", "SLSA Provenance", 115],
    ["https://spdx.dev/Document/v2.3", "SBOM (SPDX)", 98],
    ["https://in-toto.io/attestation/vulns/v0.1", "Vulnerability Scan", 82],
    ["https://slsa.dev/verification_summary/v1", "SLSA VSA", 60],
    ["https://in-toto.io/attestation/test/v0.1", "Test Results", 38],
  ]),
  "rhtas-production": buildAttestationCoverage(55, [
    ["https://slsa.dev/provenance/v1", "SLSA Provenance", 53],
    ["https://spdx.dev/Document/v2.3", "SBOM (SPDX)", 50],
    ["https://in-toto.io/attestation/vulns/v0.1", "Vulnerability Scan", 48],
    ["https://slsa.dev/verification_summary/v1", "SLSA VSA", 42],
    ["https://in-toto.io/attestation/test/v0.1", "Test Results", 30],
  ]),
  "rhtas-staging": buildAttestationCoverage(35, [
    ["https://slsa.dev/provenance/v1", "SLSA Provenance", 31],
    ["https://spdx.dev/Document/v2.3", "SBOM (SPDX)", 26],
    ["https://in-toto.io/attestation/vulns/v0.1", "Vulnerability Scan", 20],
    ["https://slsa.dev/verification_summary/v1", "SLSA VSA", 12],
    ["https://in-toto.io/attestation/test/v0.1", "Test Results", 6],
  ]),
  "rhtas-dev": buildAttestationCoverage(22, [
    ["https://slsa.dev/provenance/v1", "SLSA Provenance", 19],
    ["https://spdx.dev/Document/v2.3", "SBOM (SPDX)", 15],
    ["https://in-toto.io/attestation/vulns/v0.1", "Vulnerability Scan", 10],
    ["https://slsa.dev/verification_summary/v1", "SLSA VSA", 5],
    ["https://in-toto.io/attestation/test/v0.1", "Test Results", 2],
  ]),
  "trusted-artifact-signer": buildAttestationCoverage(12, [
    ["https://slsa.dev/provenance/v1", "SLSA Provenance", 12],
    ["https://spdx.dev/Document/v2.3", "SBOM (SPDX)", 11],
    ["https://in-toto.io/attestation/vulns/v0.1", "Vulnerability Scan", 10],
    ["https://slsa.dev/verification_summary/v1", "SLSA VSA", 8],
    ["https://in-toto.io/attestation/test/v0.1", "Test Results", 5],
  ]),
};

export const getAttestationCoverageMock = (env?: string): { data: AttestationTypeCoverage[] } => ({
  data: attestationCoverageByEnv[env ?? "all"] ?? attestationCoverageByEnv.all,
});
