import React from "react";

import { Card, CardBody, CardTitle, Flex, FlexItem, Label, Title } from "@patternfly/react-core";
import type { LabelProps } from "@patternfly/react-core";

import type { PostureSummary } from "@app/client";

function percentageColor(value: number): LabelProps["color"] {
  if (value >= 90) return "green";
  if (value >= 70) return "orange";
  return "red";
}

interface IPostureSummaryCardsProps {
  summary: PostureSummary;
}

export const PostureSummaryCards: React.FC<IPostureSummaryCardsProps> = ({ summary }) => {
  const withAttestationPct =
    summary.signedCount > 0 ? Math.round((summary.signedWithAttestationCount / summary.signedCount) * 1000) / 10 : 0;

  return (
    <Flex direction={{ default: "column", md: "row" }} spaceItems={{ default: "spaceItemsMd" }}>
      <FlexItem flex={{ default: "flex_1" }}>
        <Card isFullHeight>
          <CardTitle>Signed Artifacts</CardTitle>
          <CardBody>
            <Title headingLevel="h3" size="3xl">
              {summary.signedCount}
            </Title>
          </CardBody>
        </Card>
      </FlexItem>
      <FlexItem flex={{ default: "flex_1" }}>
        <Card isFullHeight>
          <CardTitle>With Attestations</CardTitle>
          <CardBody>
            <Title headingLevel="h3" size="3xl" style={{ display: "inline" }}>
              {summary.signedWithAttestationCount}
            </Title>{" "}
            <Label color={percentageColor(withAttestationPct)}>{withAttestationPct}% of signed</Label>
          </CardBody>
        </Card>
      </FlexItem>
      <FlexItem flex={{ default: "flex_1" }}>
        <Card isFullHeight>
          <CardTitle>Attestation Coverage</CardTitle>
          <CardBody>
            <Title headingLevel="h3" size="3xl" style={{ display: "inline" }}>
              {summary.attestationCoverage}%
            </Title>{" "}
            <Label color={percentageColor(summary.attestationCoverage)}>
              {summary.attestationCoverage >= 95
                ? "Excellent"
                : summary.attestationCoverage >= 80
                  ? "Good"
                  : "Needs improvement"}
            </Label>
          </CardBody>
        </Card>
      </FlexItem>
    </Flex>
  );
};
