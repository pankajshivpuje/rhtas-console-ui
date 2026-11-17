import type { ServiceDetail, ServiceStatus } from "./mocks/health.mock";

export type OverallHealth = ServiceStatus | "unavailable";

export const getOverallHealth = (services?: ServiceDetail[]): OverallHealth => {
  if (!services?.length) return "unavailable";
  if (services.some((service) => service.status === "down")) return "down";
  if (services.some((service) => service.status === "degraded")) return "degraded";
  return "healthy";
};

export const describeServiceHealth = (services: ServiceDetail[]): string => {
  const down = services.filter((service) => service.status === "down").map((service) => service.name);
  const degraded = services.filter((service) => service.status === "degraded").map((service) => service.name);
  const issues = [
    down.length && `${down.join(", ")} down`,
    degraded.length && `${degraded.join(", ")} degraded`,
  ].filter(Boolean);
  return issues.length ? `${issues.join("; ")}.` : "All monitored services are healthy.";
};
