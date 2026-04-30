import React from "react";

import {
  Card,
  CardBody,
  CardTitle,
  Content,
  Flex,
  FlexItem,
  Label,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import type { LabelProps } from "@patternfly/react-core";

import type { ExpiringTrustAsset } from "@app/queries/health";

interface IExpiringTrustAssetsProps {
  assets: ExpiringTrustAsset[];
}

function statusColor(status: ExpiringTrustAsset["status"]): LabelProps["color"] {
  switch (status) {
    case "expired":
      return "red";
    case "expiring":
      return "red";
    case "ok":
      return "grey";
  }
}

export const ExpiringTrustAssets: React.FC<IExpiringTrustAssetsProps> = ({ assets }) => {
  const expiredCount = assets.filter((a) => a.status === "expired").length;

  return (
    <Card isFullHeight>
      <CardTitle>
        <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} alignItems={{ default: "alignItemsCenter" }}>
          <FlexItem>Expiring trust assets</FlexItem>
          {expiredCount > 0 && (
            <FlexItem>
              <Label color="red" isCompact>
                {expiredCount} expired
              </Label>
            </FlexItem>
          )}
        </Flex>
      </CardTitle>
      <CardBody>
        <Stack>
          {assets.map((asset, idx) => (
            <StackItem key={idx}>
              <div
                style={{
                  padding: "var(--pf-t--global--spacer--sm) 0",
                  borderBottom:
                    idx < assets.length - 1
                      ? "1px solid var(--pf-t--global--border--color--default)"
                      : undefined,
                }}
              >
                <Flex
                  justifyContent={{ default: "justifyContentSpaceBetween" }}
                  alignItems={{ default: "alignItemsCenter" }}
                >
                  <FlexItem>
                    <Content>
                      <Content component="p">{asset.name}</Content>
                      <Content component="small" style={{ color: "var(--pf-t--global--text--color--subtle)" }}>
                        {asset.expirationDate}
                      </Content>
                    </Content>
                  </FlexItem>
                  <FlexItem>
                    <Content
                      component="p"
                      style={{
                        fontWeight: 500,
                        color:
                          asset.status === "expired" || asset.status === "expiring"
                            ? "var(--pf-t--global--color--status--danger--default)"
                            : undefined,
                      }}
                    >
                      {asset.timeLabel}
                    </Content>
                  </FlexItem>
                </Flex>
              </div>
            </StackItem>
          ))}
          <StackItem>
            <Content style={{ marginTop: "var(--pf-t--global--spacer--sm)" }}>
              <a href="#">Renewal runbook &rarr;</a>
            </Content>
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};
