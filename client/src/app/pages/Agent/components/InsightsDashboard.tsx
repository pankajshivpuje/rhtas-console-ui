import React from "react";
import {
  EmptyState,
  EmptyStateBody,
  Flex,
  FlexItem,
  Gallery,
  GalleryItem,
  Label,
} from "@patternfly/react-core";
import { CheckCircleIcon } from "@patternfly/react-icons";

import type { AgentInsight } from "@app/client";

import { InsightCard } from "./InsightCard";

interface InsightsDashboardProps {
  insights: AgentInsight[];
  onInsightClick: (insight: AgentInsight) => void;
}

export const InsightsDashboard: React.FC<InsightsDashboardProps> = ({
  insights,
  onInsightClick,
}) => {
  const criticalCount = insights.filter((i) => i.severity === "critical").length;
  const warningCount = insights.filter((i) => i.severity === "warning").length;
  const infoCount = insights.filter((i) => i.severity === "info").length;

  if (insights.length === 0) {
    return (
      <EmptyState headingLevel="h3" titleText="No Issues Detected" icon={CheckCircleIcon}>
        <EmptyStateBody>
          Your signing infrastructure looks healthy.
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <div>
      <Flex gap={{ default: "gapMd" }} style={{ marginBottom: "var(--pf-t--global--spacer--md)" }}>
        {criticalCount > 0 && (
          <FlexItem>
            <Label color="red">{criticalCount} Critical</Label>
          </FlexItem>
        )}
        {warningCount > 0 && (
          <FlexItem>
            <Label color="orange">{warningCount} Warning{warningCount !== 1 ? "s" : ""}</Label>
          </FlexItem>
        )}
        {infoCount > 0 && (
          <FlexItem>
            <Label color="blue">{infoCount} Info</Label>
          </FlexItem>
        )}
      </Flex>
      <Gallery hasGutter minWidths={{ default: "300px" }}>
        {insights.map((insight) => (
          <GalleryItem key={insight.id}>
            <InsightCard insight={insight} onClick={onInsightClick} />
          </GalleryItem>
        ))}
      </Gallery>
    </div>
  );
};
