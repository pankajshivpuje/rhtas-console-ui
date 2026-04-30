import React from "react";

import { Card, CardBody, CardTitle, Flex, FlexItem, Label, Title } from "@patternfly/react-core";
import type { LabelProps } from "@patternfly/react-core";

import type { PostureSummary } from "@app/client";

function percentageColor(value: number): LabelProps["color"] {
  if (value >= 90) return "green";
  if (value >= 70) return "orange";
  return "red";
}

interface ISigningActivitySummaryProps {
  summary: PostureSummary;
}

export const SigningActivitySummary: React.FC<ISigningActivitySummaryProps> = ({ summary }) => {
  return (
    <Flex direction={{ default: "column", md: "row" }} spaceItems={{ default: "spaceItemsMd" }}>
      <FlexItem flex={{ default: "flex_1" }}>
        <Card isFullHeight>
          <CardTitle>Total Artifacts</CardTitle>
          <CardBody>
            <Title headingLevel="h3" size="3xl">{summary.totalArtifacts}</Title>
          </CardBody>
        </Card>
      </FlexItem>
      <FlexItem flex={{ default: "flex_1" }}>
        <Card isFullHeight>
          <CardTitle>Signed</CardTitle>
          <CardBody>
            <Title headingLevel="h3" size="3xl" style={{ display: "inline" }}>{summary.signedPercentage}%</Title>{" "}
            <Label color={percentageColor(summary.signedPercentage)}>
              {summary.signedCount} / {summary.totalArtifacts}
            </Label>
          </CardBody>
        </Card>
      </FlexItem>
      <FlexItem flex={{ default: "flex_1" }}>
        <Card isFullHeight>
          <CardTitle>Unsigned</CardTitle>
          <CardBody>
            <Title headingLevel="h3" size="3xl" style={{ display: "inline" }}>{summary.unsignedCount}</Title>{" "}
            <Label color={summary.unsignedCount > 0 ? "red" : "green"}>
              {summary.unsignedCount > 0 ? "Action needed" : "All clear"}
            </Label>
          </CardBody>
        </Card>
      </FlexItem>
    </Flex>
  );
};
