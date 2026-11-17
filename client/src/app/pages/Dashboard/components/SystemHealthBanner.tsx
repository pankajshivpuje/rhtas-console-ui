import React from "react";

import { Alert, AlertVariant } from "@patternfly/react-core";

import type { ServiceHealthStatus } from "@app/queries/health";
import { describeServiceHealth, getOverallHealth, type OverallHealth } from "@app/queries/healthSummary";

interface ISystemHealthBannerProps {
  serviceHealth?: ServiceHealthStatus;
  isLoading: boolean;
  hasError: boolean;
}

const variants: Record<OverallHealth, AlertVariant> = {
  healthy: AlertVariant.success,
  degraded: AlertVariant.warning,
  down: AlertVariant.danger,
  unavailable: AlertVariant.info,
};

export const SystemHealthBanner: React.FC<ISystemHealthBannerProps> = ({ serviceHealth, isLoading, hasError }) => {
  const services = hasError ? undefined : serviceHealth?.services;
  const status = getOverallHealth(services);
  const label = isLoading ? "Checking" : status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Alert isInline variant={isLoading ? AlertVariant.info : variants[status]} title={`Overall health: ${label}`}>
      <p>
        {isLoading
          ? "Checking monitored services."
          : status === "unavailable"
            ? "Service health is unavailable. Try refreshing."
            : describeServiceHealth(services ?? [])}
      </p>
    </Alert>
  );
};
