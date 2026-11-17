import type { Alert, AlertListResponse, AlertSummary } from "@app/client";
import type { MockHealthScenario } from "@app/components/mockHealthContext";
import type { AlertFilters } from "../alerts";

import { serviceDegradedMock, serviceHealthyMock, serviceHealthMock } from "./health.mock";

const historicalAlert: Alert = {
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
};

const tsaAlert: Alert = {
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
};

const expiringFulcioAlert: Alert = {
  id: "alert-fulcio-certificate",
  alertName: "RHTASCertificateExpiringSoon",
  severity: "warning",
  status: "firing",
  summary: "Certificate Fulcio intermediate CA expires in 28 days",
  description: "The Fulcio intermediate CA certificate will expire soon.",
  source: "prometheus",
  labels: { alertname: "RHTASCertificateExpiringSoon", certificate_name: "fulcio-intermediate", component: "fulcio" },
  annotations: { summary: "Certificate Fulcio intermediate CA expires in 28 days" },
  startsAt: "2026-04-15T10:00:00Z",
  endsAt: null,
  fingerprint: "fulcio-certificate",
  acknowledged: false,
  acknowledgedBy: null,
  acknowledgedAt: null,
};

export const getScenarioAlerts = (scenario: MockHealthScenario, acknowledgedAlerts: Record<string, string> = {}) => {
  const health =
    scenario === "healthy" ? serviceHealthyMock : scenario === "degraded" ? serviceDegradedMock : serviceHealthMock;
  const serviceAlerts: Alert[] = health.services
    .filter((service) => service.status !== "healthy")
    .map((service) => {
      const severity = service.status === "down" ? "critical" : "warning";
      const alertName = service.status === "down" ? "RHTASComponentDown" : "RHTASComponentDegraded";
      const summary =
        service.name === "TUF" && service.status === "down"
          ? "TUF root metadata expired"
          : `TAS component ${service.name.toLowerCase()} is ${service.status}`;
      const id = `service-${service.name.toLowerCase()}-${service.status}`;
      return {
        id,
        alertName,
        severity,
        status: "firing",
        summary,
        description: service.drillDown.impactMessage || service.detail,
        source: "prometheus",
        labels: { alertname: alertName, component: service.name.toLowerCase(), severity },
        annotations: { summary },
        startsAt: "2026-04-29T08:30:00Z",
        endsAt: null,
        fingerprint: id,
        acknowledged: false,
        acknowledgedBy: null,
        acknowledgedAt: null,
      };
    });

  return [...serviceAlerts, ...(scenario === "down" ? [expiringFulcioAlert] : []), historicalAlert, tsaAlert].map(
    (alert) => {
      const acknowledgedAt = acknowledgedAlerts[alert.id];
      return acknowledgedAt ? { ...alert, acknowledged: true, acknowledgedBy: "user", acknowledgedAt } : alert;
    }
  );
};

export const getMockAlertList = (alerts: Alert[], filters?: AlertFilters): AlertListResponse => {
  const filtered = alerts.filter(
    (alert) =>
      (!filters?.status || alert.status === filters.status) &&
      (!filters?.severity || alert.severity === filters.severity) &&
      (filters?.acknowledged === undefined || alert.acknowledged === filters.acknowledged)
  );
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;
  return { data: filtered.slice(offset, offset + limit), total: filtered.length, limit, offset };
};

export const getMockAlertSummary = (alerts: Alert[]): AlertSummary => ({
  total: alerts.length,
  critical: alerts.filter((alert) => alert.status === "firing" && alert.severity === "critical").length,
  warning: alerts.filter((alert) => alert.status === "firing" && alert.severity === "warning").length,
  info: alerts.filter((alert) => alert.status === "firing" && alert.severity === "info").length,
  acknowledged: alerts.filter((alert) => alert.acknowledged).length,
  unacknowledged: alerts.filter((alert) => !alert.acknowledged).length,
});

export const alertsMock = getScenarioAlerts("down");
export const alertListResponseMock = getMockAlertList(alertsMock);
export const alertSummaryMock = getMockAlertSummary(alertsMock);
