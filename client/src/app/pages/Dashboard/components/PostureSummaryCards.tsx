import React from "react";
import { useNavigate } from "react-router-dom";

import { Button, Card, CardBody, CardTitle, Flex, FlexItem, Label } from "@patternfly/react-core";
import type { LabelProps } from "@patternfly/react-core";

import type { PostureSummary } from "@app/client";
import { Paths } from "@app/Routes";

function percentageColor(value: number): LabelProps["color"] {
  if (value >= 90) return "green";
  if (value >= 70) return "orange";
  return "red";
}

interface IPostureSummaryCardsProps {
  summary: PostureSummary;
  environment?: string;
}

export const PostureSummaryCards: React.FC<IPostureSummaryCardsProps> = ({ summary, environment }) => {
  const navigate = useNavigate();

  const handleTotalArtifactsClick = () => {
    const params = environment ? `?environment=${encodeURIComponent(environment)}` : "";
    navigate(`${Paths.totalArtifacts}${params}`);
  };

  return (
    <Flex direction={{ default: "column", md: "row" }} spaceItems={{ default: "spaceItemsMd" }}>
      <FlexItem flex={{ default: "flex_1" }}>
        <Card isFullHeight isClickable style={{ border: "1px solid var(--pf-t--global--border--color--default)" }}>
          <CardTitle>Total Artifacts</CardTitle>
          <CardBody>
            <Button variant="link" isInline onClick={handleTotalArtifactsClick} style={{ fontSize: "2rem", fontWeight: "bold" }}>
              {summary.totalArtifacts}
            </Button>
          </CardBody>
        </Card>
      </FlexItem>
      <FlexItem flex={{ default: "flex_1" }}>
        <Card isFullHeight>
          <CardTitle>Signed</CardTitle>
          <CardBody>
            <span style={{ fontSize: "2rem", fontWeight: "bold" }}>{summary.signedPercentage}%</span>{" "}
            <Label color={percentageColor(summary.signedPercentage)}>
              {summary.signedCount} / {summary.totalArtifacts}
            </Label>
          </CardBody>
        </Card>
      </FlexItem>
      <FlexItem flex={{ default: "flex_1" }}>
        <Card isFullHeight>
          <CardTitle>Unsigned in Production</CardTitle>
          <CardBody>
            <span style={{ fontSize: "2rem", fontWeight: "bold" }}>{summary.unsignedCount}</span>{" "}
            <Label color={summary.unsignedCount > 0 ? "red" : "green"}>
              {summary.unsignedCount > 0 ? "Action needed" : "All clear"}
            </Label>
          </CardBody>
        </Card>
      </FlexItem>
      <FlexItem flex={{ default: "flex_1" }}>
        <Card isFullHeight>
          <CardTitle>Attestation Coverage</CardTitle>
          <CardBody>
            <span style={{ fontSize: "2rem", fontWeight: "bold" }}>{summary.attestationCoverage}%</span>{" "}
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
