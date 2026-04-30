import React from "react";

import { Card, CardBody, Content, Flex, FlexItem, Icon } from "@patternfly/react-core";

import type { ServiceDetail, ServiceStatus } from "@app/queries/health";

interface IServiceStatusCardsProps {
  services: ServiceDetail[];
  onServiceClick?: (service: ServiceDetail) => void;
}

function statusColor(status: ServiceStatus): string {
  switch (status) {
    case "healthy":
      return "var(--pf-t--global--color--status--success--default)";
    case "degraded":
      return "var(--pf-t--global--color--status--warning--default)";
    case "down":
      return "var(--pf-t--global--color--status--danger--default)";
  }
}

function statusTextColor(status: ServiceStatus): string | undefined {
  switch (status) {
    case "degraded":
      return "var(--pf-t--global--color--status--warning--default)";
    case "down":
      return "var(--pf-t--global--color--status--danger--default)";
    default:
      return undefined;
  }
}

const StatusDot: React.FC<{ status: ServiceStatus }> = ({ status }) => (
  <Icon>
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        backgroundColor: statusColor(status),
      }}
    />
  </Icon>
);

export const ServiceStatusCards: React.FC<IServiceStatusCardsProps> = ({ services, onServiceClick }) => {
  return (
    <Flex direction={{ default: "column", md: "row" }} spaceItems={{ default: "spaceItemsMd" }}>
      {services.map((service) => {
        return (
          <FlexItem
            key={service.name}
            flex={{ default: "flex_1" }}
            onClick={() => onServiceClick?.(service)}
            style={onServiceClick ? { cursor: "pointer" } : undefined}
          >
            <Card isFullHeight>
              <CardBody>
                <Flex alignItems={{ default: "alignItemsCenter" }} spaceItems={{ default: "spaceItemsSm" }}>
                  <FlexItem>
                    <StatusDot status={service.status} />
                  </FlexItem>
                  <FlexItem>
                    <Content>
                      <Content component="p" style={{ fontWeight: 500 }}>{service.name}</Content>
                    </Content>
                  </FlexItem>
                </Flex>
                <Content component="p" style={{ marginTop: "var(--pf-t--global--spacer--sm)", color: statusTextColor(service.status) }}>
                  {service.statusText}
                </Content>
                <Content component="small" style={{ color: "var(--pf-t--global--text--color--subtle)" }}>
                  {service.detail}
                </Content>
              </CardBody>
            </Card>
          </FlexItem>
        );
      })}
    </Flex>
  );
};
