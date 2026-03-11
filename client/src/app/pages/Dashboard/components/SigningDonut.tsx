import React from "react";

import { Card, CardBody, CardTitle } from "@patternfly/react-core";
import { ChartDonut, ChartThemeColor } from "@patternfly/react-charts/victory";

import type { PostureSummary } from "@app/client";

interface ISigningDonutProps {
  summary: PostureSummary;
}

export const SigningDonut: React.FC<ISigningDonutProps> = ({ summary }) => {
  const chartData = [
    { x: "Signed", y: summary.signedCount },
    { x: "Unsigned", y: summary.unsignedCount },
    { x: "Partially Signed", y: summary.partiallySignedCount },
  ];

  const legendData = chartData.map((d) => ({ name: `${d.x}: ${d.y}` }));

  return (
    <Card style={{ marginTop: "var(--pf-t--global--spacer--md)" }}>
      <CardTitle>Signing Status Distribution</CardTitle>
      <CardBody>
        <div style={{ height: "230px", width: "400px" }}>
          <ChartDonut
            constrainToVisibleArea
            data={chartData}
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            labels={({ datum }) => `${datum.x}: ${datum.y}`}
            legendData={legendData}
            legendOrientation="vertical"
            legendPosition="right"
            name="SigningStatus"
            ariaTitle="Signing status donut chart"
            padding={{
              bottom: 20,
              left: 20,
              right: 140,
              top: 20,
            }}
            subTitle="Artifacts"
            title={summary.totalArtifacts.toString()}
            themeColor={ChartThemeColor.multiOrdered}
            width={400}
          />
        </div>
      </CardBody>
    </Card>
  );
};
