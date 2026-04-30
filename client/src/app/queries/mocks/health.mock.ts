export type ServiceStatus = "healthy" | "degraded" | "down";

export interface ServiceDetail {
  name: string;
  status: ServiceStatus;
  statusText: string;
  detail: string;
  drillDown: ServiceDrillDown;
}

export interface ServiceHealthStatus {
  overall: "operational" | "degraded" | "down";
  overallMessage: string;
  overallDescription: string;
  services: ServiceDetail[];
}

export interface ExpiringTrustAsset {
  name: string;
  expirationDate: string;
  status: "expired" | "expiring" | "ok";
  timeLabel: string;
}

export interface ErrorRateData {
  totalErrors: number;
  errorRate: number;
  breakdown: { label: string; count: number; severity?: "danger" | "default" }[];
}

export interface IncidentEvent {
  description: string;
  timestamp: string;
  relativeTime: string;
  severity: "danger" | "warning" | "info";
}

export type ProbeStatus = "success" | "warning" | "danger";

export interface CertChainItem {
  name: string;
  status: string;
  severity: "success" | "warning" | "subtle";
}

export interface FailingCheck {
  name: string;
  detail: string;
  severity: "danger" | "success" | "subtle";
}

export interface ServiceDrillDown {
  endpoint: string;
  impactMessage: string;
  lastSuccessfulProbe: string;
  consecutiveFailures: number;
  probeHistory: ProbeStatus[];
  certChain?: CertChainItem[];
  failingChecks: FailingCheck[];
}

export interface OperationalHealthData {
  serviceHealth: ServiceHealthStatus;
  expiringAssets: ExpiringTrustAsset[];
  errorRate: ErrorRateData;
  incidents: IncidentEvent[];
}

export const serviceHealthMock: ServiceHealthStatus = {
  overall: "down",
  overallMessage: "Down — signing pipeline unavailable",
  overallDescription:
    "Fulcio is unreachable and the TUF root has expired. New signatures will fail until both are restored.",
  services: [
    {
      name: "Cosign",
      status: "healthy",
      statusText: "Healthy",
      detail: "p95 138ms · 0.0% errors",
      drillDown: {
        endpoint: "https://cosign.tas.internal",
        impactMessage: "",
        lastSuccessfulProbe: "Just now",
        consecutiveFailures: 0,
        probeHistory: Array(20).fill("success") as ProbeStatus[],
        failingChecks: [
          { name: "TCP connect to cosign.tas.internal:443", detail: "healthy · 0 failures", severity: "success" },
          { name: "DNS resolution", detail: "resolves to 10.4.12.50", severity: "success" },
          { name: "TLS handshake", detail: "valid certificate", severity: "success" },
          { name: "/healthz returns 200", detail: "200 OK · avg 12ms", severity: "success" },
        ],
      },
    },
    {
      name: "Fulcio",
      status: "down",
      statusText: "Down",
      detail: "No response · 47 attempts",
      drillDown: {
        endpoint: "https://fulcio.tas.internal/api/v2",
        impactMessage: "Last successful probe 38 minutes ago. 47 consecutive failures. New certificate issuance is blocked.",
        lastSuccessfulProbe: "38 minutes ago",
        consecutiveFailures: 47,
        probeHistory: [
          ...Array(11).fill("success") as ProbeStatus[],
          "warning" as ProbeStatus,
          ...Array(8).fill("danger") as ProbeStatus[],
        ],
        certChain: [
          { name: "Root CA", status: "Valid · 4y left", severity: "success" },
          { name: "Intermediate CA", status: "Valid · 28d left", severity: "warning" },
          { name: "CT log inclusion", status: "Unknown · probe failing", severity: "subtle" },
        ],
        failingChecks: [
          { name: "TCP connect to fulcio.tas.internal:443", detail: "connection refused · 47 consecutive", severity: "danger" },
          { name: "DNS resolution", detail: "resolves to 10.4.12.88", severity: "success" },
          { name: "TLS handshake", detail: "skipped · upstream check failed", severity: "subtle" },
          { name: "/api/v2/trustBundle returns 200", detail: "skipped · upstream check failed", severity: "subtle" },
        ],
      },
    },
    {
      name: "Rekor",
      status: "degraded",
      statusText: "Degraded",
      detail: "p95 5.8s · 8.2% errors",
      drillDown: {
        endpoint: "https://rekor.tas.internal/api/v1",
        impactMessage: "Rekor latency has exceeded the 2s threshold. Log entries may be delayed. Verification still functional.",
        lastSuccessfulProbe: "2 minutes ago",
        consecutiveFailures: 0,
        probeHistory: [
          ...Array(14).fill("success") as ProbeStatus[],
          ...Array(4).fill("warning") as ProbeStatus[],
          "success" as ProbeStatus,
          "warning" as ProbeStatus,
        ],
        failingChecks: [
          { name: "TCP connect to rekor.tas.internal:443", detail: "healthy · 0 failures", severity: "success" },
          { name: "DNS resolution", detail: "resolves to 10.4.12.102", severity: "success" },
          { name: "TLS handshake", detail: "valid certificate", severity: "success" },
          { name: "/api/v1/log responds within 2s", detail: "p95 5.8s · exceeds threshold", severity: "danger" },
        ],
      },
    },
    {
      name: "TUF",
      status: "down",
      statusText: "Down",
      detail: "Root metadata expired",
      drillDown: {
        endpoint: "https://tuf.tas.internal",
        impactMessage: "TUF root metadata has expired. Clients cannot verify trust anchors. Signature verification will fail.",
        lastSuccessfulProbe: "14 hours ago",
        consecutiveFailures: 168,
        probeHistory: [
          ...Array(6).fill("success") as ProbeStatus[],
          ...Array(14).fill("danger") as ProbeStatus[],
        ],
        failingChecks: [
          { name: "TCP connect to tuf.tas.internal:443", detail: "healthy · 0 failures", severity: "success" },
          { name: "DNS resolution", detail: "resolves to 10.4.12.40", severity: "success" },
          { name: "Root metadata validity", detail: "expired Apr 7, 2026 · 14h ago", severity: "danger" },
          { name: "Targets metadata validity", detail: "valid · 89d left", severity: "success" },
        ],
      },
    },
  ],
};

// --- Healthy state mocks ---

export const serviceHealthyMock: ServiceHealthStatus = {
  overall: "operational",
  overallMessage: "All systems operational",
  overallDescription: "",
  services: [
    {
      name: "Cosign",
      status: "healthy",
      statusText: "Healthy",
      detail: "p95 138ms · 0.0% errors",
      drillDown: {
        endpoint: "https://cosign.tas.internal",
        impactMessage: "",
        lastSuccessfulProbe: "Just now",
        consecutiveFailures: 0,
        probeHistory: Array(20).fill("success") as ProbeStatus[],
        failingChecks: [
          { name: "TCP connect to cosign.tas.internal:443", detail: "healthy · 0 failures", severity: "success" },
          { name: "DNS resolution", detail: "resolves to 10.4.12.50", severity: "success" },
          { name: "TLS handshake", detail: "valid certificate", severity: "success" },
          { name: "/healthz returns 200", detail: "200 OK · avg 12ms", severity: "success" },
        ],
      },
    },
    {
      name: "Fulcio",
      status: "healthy",
      statusText: "Healthy",
      detail: "p95 92ms · 0.0% errors",
      drillDown: {
        endpoint: "https://fulcio.tas.internal/api/v2",
        impactMessage: "",
        lastSuccessfulProbe: "Just now",
        consecutiveFailures: 0,
        probeHistory: Array(20).fill("success") as ProbeStatus[],
        certChain: [
          { name: "Root CA", status: "Valid · 4y left", severity: "success" },
          { name: "Intermediate CA", status: "Valid · 1y 28d left", severity: "success" },
          { name: "CT log inclusion", status: "Active", severity: "success" },
        ],
        failingChecks: [
          { name: "TCP connect to fulcio.tas.internal:443", detail: "healthy · 0 failures", severity: "success" },
          { name: "DNS resolution", detail: "resolves to 10.4.12.88", severity: "success" },
          { name: "TLS handshake", detail: "valid certificate", severity: "success" },
          { name: "/api/v2/trustBundle returns 200", detail: "200 OK · avg 45ms", severity: "success" },
        ],
      },
    },
    {
      name: "Rekor",
      status: "healthy",
      statusText: "Healthy",
      detail: "p95 210ms · 0.0% errors",
      drillDown: {
        endpoint: "https://rekor.tas.internal/api/v1",
        impactMessage: "",
        lastSuccessfulProbe: "Just now",
        consecutiveFailures: 0,
        probeHistory: Array(20).fill("success") as ProbeStatus[],
        failingChecks: [
          { name: "TCP connect to rekor.tas.internal:443", detail: "healthy · 0 failures", severity: "success" },
          { name: "DNS resolution", detail: "resolves to 10.4.12.102", severity: "success" },
          { name: "TLS handshake", detail: "valid certificate", severity: "success" },
          { name: "/api/v1/log responds within 2s", detail: "p95 210ms · within threshold", severity: "success" },
        ],
      },
    },
    {
      name: "TUF",
      status: "healthy",
      statusText: "Healthy",
      detail: "Root metadata valid · 89d left",
      drillDown: {
        endpoint: "https://tuf.tas.internal",
        impactMessage: "",
        lastSuccessfulProbe: "Just now",
        consecutiveFailures: 0,
        probeHistory: Array(20).fill("success") as ProbeStatus[],
        failingChecks: [
          { name: "TCP connect to tuf.tas.internal:443", detail: "healthy · 0 failures", severity: "success" },
          { name: "DNS resolution", detail: "resolves to 10.4.12.40", severity: "success" },
          { name: "Root metadata validity", detail: "valid · 89d left", severity: "success" },
          { name: "Targets metadata validity", detail: "valid · 89d left", severity: "success" },
        ],
      },
    },
  ],
};

export const expiringAssetsHealthyMock: ExpiringTrustAsset[] = [
  {
    name: "TUF root metadata",
    expirationDate: "Expires Jul 5, 2026",
    status: "ok",
    timeLabel: "89 days",
  },
  {
    name: "Fulcio intermediate CA",
    expirationDate: "Expires May 6, 2027",
    status: "ok",
    timeLabel: "1y 28d",
  },
  {
    name: "CT log shard 2026",
    expirationDate: "Expires Dec 31, 2026",
    status: "ok",
    timeLabel: "267 days",
  },
];

export const errorRateHealthyMock: ErrorRateData = {
  totalErrors: 3,
  errorRate: 0.02,
  breakdown: [
    { label: "5xx server errors", count: 0 },
    { label: "Timeouts", count: 1 },
    { label: "Signature verify failures", count: 0 },
    { label: "4xx client errors", count: 2 },
  ],
};

export const incidentsHealthyMock: IncidentEvent[] = [];

// --- Down state mocks ---

export const expiringAssetsMock: ExpiringTrustAsset[] = [
  {
    name: "TUF root metadata",
    expirationDate: "Expired Apr 7, 2026 · 14h ago",
    status: "expired",
    timeLabel: "Expired",
  },
  {
    name: "Fulcio intermediate CA",
    expirationDate: "Expires May 6, 2026",
    status: "expiring",
    timeLabel: "28 days",
  },
  {
    name: "CT log shard 2026",
    expirationDate: "Expires Dec 31, 2026",
    status: "ok",
    timeLabel: "267 days",
  },
];

export const errorRateMock: ErrorRateData = {
  totalErrors: 2184,
  errorRate: 42.7,
  breakdown: [
    { label: "5xx server errors", count: 1512 },
    { label: "Timeouts", count: 488 },
    { label: "Signature verify failures", count: 183, severity: "danger" },
    { label: "4xx client errors", count: 1 },
  ],
};

export const incidentsMock: IncidentEvent[] = [
  {
    description: "TUF root metadata expired",
    timestamp: "02:14 UTC",
    relativeTime: "14h 3m ago",
    severity: "danger",
  },
  {
    description: "Fulcio probes started failing",
    timestamp: "15:39 UTC",
    relativeTime: "38m ago",
    severity: "danger",
  },
  {
    description: "Rekor latency exceeded threshold",
    timestamp: "15:55 UTC",
    relativeTime: "22m ago",
    severity: "warning",
  },
  {
    description: "On-call paged via PagerDuty",
    timestamp: "15:58 UTC",
    relativeTime: "19m ago",
    severity: "info",
  },
];
