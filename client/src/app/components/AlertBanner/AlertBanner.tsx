import { useState } from "react";
import { Link } from "react-router-dom";

import { Alert, AlertActionCloseButton, AlertGroup } from "@patternfly/react-core";

import { useFetchAlerts } from "@app/queries/alerts";
import { Paths } from "@app/Routes";

const MAX_BANNERS = 3;

export const AlertBanner = () => {
  const { alerts } = useFetchAlerts({ status: "firing", severity: "critical" });
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = alerts.filter((a) => a.status === "firing" && a.severity === "critical" && !dismissed.has(a.id));

  if (visible.length === 0) return null;

  const shown = visible.slice(0, MAX_BANNERS);
  const overflow = visible.length - shown.length;

  return (
    <AlertGroup aria-live="polite">
      {shown.map((alert) => (
        <Alert
          key={alert.id}
          variant="danger"
          title={alert.summary}
          actionClose={<AlertActionCloseButton onClose={() => setDismissed((prev) => new Set(prev).add(alert.id))} />}
          isInline
        >
          {alert.description ?? alert.summary}
        </Alert>
      ))}
      {overflow > 0 && (
        <Alert variant="danger" title={`${overflow} more critical alert${overflow > 1 ? "s" : ""}`} isInline isPlain>
          <Link to={Paths.alerts}>View all alerts</Link>
        </Alert>
      )}
    </AlertGroup>
  );
};
