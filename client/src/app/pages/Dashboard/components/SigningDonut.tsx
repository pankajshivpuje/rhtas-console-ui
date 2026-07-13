import React from "react";

import { Card, CardBody, CardTitle } from "@patternfly/react-core";
import { ChartDonut, ChartThemeColor } from "@patternfly/react-charts/victory";

import type { PostureSummary } from "@app/client";

interface ISigningDonutProps {
  summary: PostureSummary;
}

export const SigningDonut: React.FC<ISigningDonutProps> = ({ summary }) => {
  const withoutAttestation = summary.signedCount - summary.signedWithAttestationCount;

  const chartData = [
    { x: "With Attestation", y: summary.signedWithAttestationCount },
    { x: "Without Attestation", y: withoutAttestation },
  ];

  const legendData = chartData.map((d) => ({ name: `${d.x}: ${d.y}` }));

  return (
    <Card isFullHeight>
      <CardTitle>Attestation Status</CardTitle>
      <CardBody>
        <div style={{ height: "300px", width: "100%" }}>
          <ChartDonut
            constrainToVisibleArea
            data={chartData}
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            labels={({ datum }) => `${datum.x}: ${datum.y}`}
            legendData={legendData}
            legendOrientation="vertical"
            legendPosition="right"
            name="AttestationStatus"
            ariaTitle="Attestation status donut chart"
            padding={{
              bottom: 20,
              left: 20,
              right: 140,
              top: 20,
            }}
            subTitle="Signed Artifacts"
            title={summary.signedCount.toString()}
            themeColor={ChartThemeColor.multiOrdered}
            width={400}
          />
        </div>
      </CardBody>
    </Card>
  );
};
