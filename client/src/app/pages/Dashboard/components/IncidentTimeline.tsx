import React from "react";

import { Card, CardBody, CardTitle, Content, Stack, StackItem } from "@patternfly/react-core";

import type { IncidentEvent } from "@app/queries/health";

interface IIncidentTimelineProps {
  incidents: IncidentEvent[];
}

function severityColor(severity: IncidentEvent["severity"]): string {
  switch (severity) {
    case "danger":
      return "var(--pf-t--global--color--status--danger--default)";
    case "warning":
      return "var(--pf-t--global--color--status--warning--default)";
    case "info":
      return "var(--pf-t--global--color--status--info--default)";
  }
}

export const IncidentTimeline: React.FC<IIncidentTimelineProps> = ({ incidents }) => {
  return (
    <Card>
      <CardTitle>Incident timeline</CardTitle>
      <CardBody>
        <div style={{ position: "relative", paddingLeft: 20 }}>
          <div
            style={{
              position: "absolute",
              left: 5,
              top: 6,
              bottom: 6,
              width: 1,
              background: "var(--pf-t--global--border--color--default)",
            }}
          />
          <Stack hasGutter>
            {incidents.map((event, idx) => (
              <StackItem key={idx}>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: -19,
                      top: 4,
                      width: 11,
                      height: 11,
                      borderRadius: "50%",
                      backgroundColor: severityColor(event.severity),
                      border: "2px solid var(--pf-t--global--background--color--primary--default)",
                    }}
                  />
                  <Content>
                    <Content component="p">{event.description}</Content>
                    <Content component="small" style={{ color: "var(--pf-t--global--text--color--subtle)" }}>
                      {event.relativeTime} &middot; {event.timestamp}
                    </Content>
                  </Content>
                </div>
              </StackItem>
            ))}
          </Stack>
        </div>
      </CardBody>
    </Card>
  );
};
