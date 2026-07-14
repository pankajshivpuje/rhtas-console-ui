import React from "react";
import { Card, CardBody, CardFooter, CardTitle, Flex, FlexItem, Label } from "@patternfly/react-core";
import { ExclamationCircleIcon, ExclamationTriangleIcon, InfoCircleIcon } from "@patternfly/react-icons";

import type { AgentInsight } from "@app/client";

interface InsightCardProps {
  insight: AgentInsight;
  onClick: (insight: AgentInsight) => void;
}

const severityConfig = {
  critical: { color: "red" as const, icon: <ExclamationCircleIcon />, label: "Critical" },
  warning: { color: "orange" as const, icon: <ExclamationTriangleIcon />, label: "Warning" },
  info: { color: "blue" as const, icon: <InfoCircleIcon />, label: "Info" },
};

const domainLabels: Record<string, string> = {
  signing: "Signing",
  attestations: "Attestations",
  "trust-root": "Trust Root",
  alerts: "Alerts",
  policy: "Policy",
  health: "Health",
};

export const InsightCard: React.FC<InsightCardProps> = ({ insight, onClick }) => {
  const config = severityConfig[insight.severity];

  return (
    <Card isSelectable isClickable onClick={() => onClick(insight)}>
      <CardTitle>
        <Flex justifyContent={{ default: "justifyContentSpaceBetween" }}>
          <FlexItem>{insight.title}</FlexItem>
          <FlexItem>
            <Label color={config.color} icon={config.icon}>
              {config.label}
            </Label>
          </FlexItem>
        </Flex>
      </CardTitle>
      <CardBody>{insight.description}</CardBody>
      <CardFooter>
        <Flex justifyContent={{ default: "justifyContentSpaceBetween" }}>
          <FlexItem>
            <Label variant="outline">{domainLabels[insight.domain] ?? insight.domain}</Label>
          </FlexItem>
          <FlexItem style={{ fontSize: "var(--pf-t--global--font--size--xs)", opacity: 0.7 }}>
            {new Date(insight.timestamp).toLocaleString()}
          </FlexItem>
        </Flex>
      </CardFooter>
    </Card>
  );
};
