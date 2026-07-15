import type { Page } from "@playwright/test";

const baseAlerts = [
  {
    id: "alert-1",
    alertName: "RHTASComponentDown",
    severity: "critical",
    status: "firing",
    summary: "TAS component rekor is down",
    description: "rekor has been unreachable for more than 2 minutes.",
    source: "prometheus",
    labels: { alertname: "RHTASComponentDown", job: "rhtas-rekor", severity: "critical" },
    annotations: { summary: "TAS component rekor is down" },
    generatorUrl: "http://prometheus:9090/graph",
    startsAt: "2026-04-29T08:30:00Z",
    endsAt: null,
    fingerprint: "a1b2c3d4e5f6",
    acknowledged: false,
    acknowledgedBy: null,
    acknowledgedAt: null,
  },
  {
    id: "alert-2",
    alertName: "RHTASCertificateExpiringSoon",
    severity: "warning",
    status: "firing",
    summary: "Certificate fulcio-root expires in 15 days",
    description: "TAS certificate fulcio-root on fulcio will expire soon.",
    source: "prometheus",
    labels: { alertname: "RHTASCertificateExpiringSoon", certificate_name: "fulcio-root", component: "fulcio" },
    annotations: { summary: "Certificate fulcio-root expires in 15 days" },
    generatorUrl: null,
    startsAt: "2026-04-15T10:00:00Z",
    endsAt: null,
    fingerprint: "f6e5d4c3b2a1",
    acknowledged: false,
    acknowledgedBy: null,
    acknowledgedAt: null,
  },
  {
    id: "alert-3",
    alertName: "RHTASVerificationFailureSpike",
    severity: "warning",
    status: "resolved",
    summary: "Verification failure rate elevated: 0.15/s",
    description: "Artifact verification failures exceeded threshold over 5-minute window.",
    source: "prometheus",
    labels: { alertname: "RHTASVerificationFailureSpike" },
    annotations: { summary: "Verification failure rate elevated: 0.15/s" },
    startsAt: "2026-04-28T14:00:00Z",
    endsAt: "2026-04-28T14:30:00Z",
    fingerprint: "1a2b3c4d5e6f",
    acknowledged: true,
    acknowledgedBy: "admin",
    acknowledgedAt: "2026-04-28T14:05:00Z",
  },
  {
    id: "alert-4",
    alertName: "RHTASCertificateExpiringSoon",
    severity: "info",
    status: "firing",
    summary: "Certificate tsa-intermediate expires in 60 days",
    description: "TAS certificate tsa-intermediate on tsa will expire in 60 days.",
    source: "prometheus",
    labels: { alertname: "RHTASCertificateExpiringSoon", certificate_name: "tsa-intermediate", component: "tsa" },
    annotations: {},
    startsAt: "2026-04-20T06:00:00Z",
    endsAt: null,
    fingerprint: "7g8h9i0j1k2l",
    acknowledged: false,
    acknowledgedBy: null,
    acknowledgedAt: null,
  },
];

export const alertsApiResponse = {
  data: baseAlerts,
  total: baseAlerts.length,
  limit: 50,
  offset: 0,
};

export const alertSummaryApiResponse = {
  total: 4,
  critical: 1,
  warning: 1,
  info: 1,
  acknowledged: 1,
  unacknowledged: 3,
};

export async function setupAlertRoutes(page: Page) {
  const acknowledgedIds = new Set<string>();

  await page.route("**/api/v1/alerts/summary", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(alertSummaryApiResponse) })
  );

  await page.route("**/api/v1/alerts", (route) => {
    if (route.request().method() === "GET") {
      const data = baseAlerts.map((a) =>
        acknowledgedIds.has(a.id)
          ? { ...a, acknowledged: true, acknowledgedBy: "e2e-user", acknowledgedAt: new Date().toISOString() }
          : a
      );
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...alertsApiResponse, data }),
      });
    }
    return route.continue();
  });

  await page.route("**/api/v1/alerts/*/acknowledge", (route) => {
    if (route.request().method() === "PATCH") {
      const url = route.request().url();
      const match = url.match(/\/alerts\/([^/]+)\/acknowledge/);
      const alertId = match?.[1];
      if (alertId) acknowledgedIds.add(alertId);

      const alert = baseAlerts.find((a) => a.id === alertId) ?? baseAlerts[0];
      const result = {
        ...alert,
        acknowledged: true,
        acknowledgedBy: "e2e-user",
        acknowledgedAt: new Date().toISOString(),
      };
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(result) });
    }
    return route.continue();
  });
}
