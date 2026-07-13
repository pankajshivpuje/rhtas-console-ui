import React from "react";

import dayjs from "dayjs";

import { Card, CardBody, CardTitle } from "@patternfly/react-core";
import {
  Chart,
  ChartAxis,
  ChartGroup,
  ChartLegend,
  ChartLine,
  ChartVoronoiContainer,
} from "@patternfly/react-charts/victory";

import type { PostureTrendPoint } from "@app/client";

interface IPostureTrendChartProps {
  trend: PostureTrendPoint[];
}

function formatTickLabel(date: string): string {
  return dayjs(date).format("MMM D");
}

export const PostureTrendChart: React.FC<IPostureTrendChartProps> = ({ trend }) => {
  const signingData = trend.map((point, i) => ({
    x: i,
    y: point.signedCount,
    name: "Signed Artifacts",
  }));

  const attestationData = trend.map((point, i) => ({
    x: i,
    y: point.signedWithAttestationCount,
    name: "With Attestations",
  }));

  const maxY = Math.max(...trend.map((p) => p.signedCount), 1);
  const yDomainMax = Math.ceil(maxY * 1.1);

  const tickCount = Math.min(6, trend.length);
  const step = Math.max(1, Math.floor((trend.length - 1) / (tickCount - 1)));
  const tickIndices: number[] = [];
  for (let i = 0; i < trend.length; i += step) {
    tickIndices.push(i);
  }
  if (tickIndices[tickIndices.length - 1] !== trend.length - 1) {
    tickIndices.push(trend.length - 1);
  }

  return (
    <Card isFullHeight>
      <CardTitle>Artifact Trend (Last 30 Days)</CardTitle>
      <CardBody>
        <div style={{ height: "300px", width: "100%" }}>
          <Chart
            containerComponent={
              <ChartVoronoiContainer
                labels={({ datum }: { datum: { x?: number; name?: string; y?: number } }) =>
                  `${datum.name}: ${datum.y}\n${datum.x != null && trend[datum.x] ? formatTickLabel(trend[datum.x].date) : ""}`
                }
                constrainToVisibleArea
              />
            }
            domain={{ y: [0, yDomainMax] }}
            height={300}
            width={800}
            legendComponent={<ChartLegend data={[{ name: "Signed Artifacts" }, { name: "With Attestations" }]} />}
            legendPosition="bottom"
            padding={{
              bottom: 75,
              left: 50,
              right: 30,
              top: 20,
            }}
            name="PostureTrend"
          >
            <ChartAxis
              tickValues={tickIndices}
              tickFormat={(i: number) => (trend[i] ? formatTickLabel(trend[i].date) : "")}
              style={{
                tickLabels: { angle: -30, textAnchor: "end", fontSize: 11 },
              }}
            />
            <ChartAxis dependentAxis showGrid />
            <ChartGroup>
              <ChartLine data={signingData} />
              <ChartLine data={attestationData} />
            </ChartGroup>
          </Chart>
        </div>
      </CardBody>
    </Card>
  );
};
