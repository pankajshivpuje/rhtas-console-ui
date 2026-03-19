import React from "react";

import { Card, CardBody, CardTitle } from "@patternfly/react-core";
import {
  Chart,
  ChartAxis,
  ChartBar,
  ChartGroup,
  ChartThemeColor,
  ChartTooltip,
} from "@patternfly/react-charts/victory";

import type { AttestationTypeCoverage } from "@app/client";

interface IAttestationCoverageChartProps {
  attestationCoverage: AttestationTypeCoverage[];
}

export const AttestationCoverageChart: React.FC<IAttestationCoverageChartProps> = ({ attestationCoverage }) => {
  const sortedData = [...attestationCoverage].sort((a, b) => b.percentage - a.percentage);

  const chartData = sortedData.map((item) => ({
    x: item.displayName,
    y: item.percentage,
    label: `${item.displayName}: ${item.percentage}% (${item.artifactCount}/${item.totalArtifacts})`,
  }));

  const chartHeight = Math.max(250, sortedData.length * 50 + 50);

  return (
    <Card style={{ marginTop: "var(--pf-t--global--spacer--md)" }}>
      <CardTitle>Attestation Presence by Type</CardTitle>
      <CardBody>
        <div style={{ height: `${chartHeight}px`, width: "100%" }}>
          <Chart
            domain={{ y: [0, 100] }}
            domainPadding={{ x: 25 }}
            height={chartHeight}
            width={800}
            horizontal
            themeColor={ChartThemeColor.blue}
            padding={{
              bottom: 50,
              left: 160,
              right: 50,
              top: 20,
            }}
            name="AttestationCoverage"
          >
            <ChartAxis
              style={{
                tickLabels: { fontSize: 12 },
              }}
            />
            <ChartAxis dependentAxis showGrid tickFormat={(t: number) => `${t}%`} />
            <ChartGroup>
              <ChartBar data={chartData} labelComponent={<ChartTooltip constrainToVisibleArea />} barWidth={20} />
            </ChartGroup>
          </Chart>
        </div>
      </CardBody>
    </Card>
  );
};
