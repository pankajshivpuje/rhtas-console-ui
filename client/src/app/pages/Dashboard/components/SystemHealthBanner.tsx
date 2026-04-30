import React from "react";

import { Alert, AlertActionLink, AlertVariant } from "@patternfly/react-core";

import type { ServiceHealthStatus } from "@app/queries/health";

interface ISystemHealthBannerProps {
  serviceHealth: ServiceHealthStatus;
}

function overallVariant(overall: ServiceHealthStatus["overall"]): AlertVariant {
  switch (overall) {
    case "down":
      return AlertVariant.danger;
    case "degraded":
      return AlertVariant.warning;
    case "operational":
      return AlertVariant.success;
  }
}

export const SystemHealthBanner: React.FC<ISystemHealthBannerProps> = ({ serviceHealth }) => {
  if (serviceHealth.overall === "operational") {
    return null;
  }

  return (
    <Alert
      variant={overallVariant(serviceHealth.overall)}
      title={serviceHealth.overallMessage}
      actionLinks={
        <>
          <AlertActionLink>View incident</AlertActionLink>
          <AlertActionLink>Open runbook</AlertActionLink>
        </>
      }
    >
      <p>{serviceHealth.overallDescription}</p>
    </Alert>
  );
};
