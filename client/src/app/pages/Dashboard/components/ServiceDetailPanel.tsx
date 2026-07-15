import React from "react";

import {
  Alert,
  AlertVariant,
  Button,
  Content,
  Flex,
  FlexItem,
  Icon,
  Label,
  Stack,
  StackItem,
  Title,
} from "@patternfly/react-core";
import { ExternalLinkAltIcon } from "@patternfly/react-icons";

import type { ServiceDetail, ProbeStatus } from "@app/queries/health";

interface IServiceDetailPanelProps {
  service: ServiceDetail;
}

function statusColor(status: ServiceDetail["status"]): string {
  switch (status) {
    case "healthy":
      return "var(--pf-t--global--color--status--success--default)";
    case "degraded":
      return "var(--pf-t--global--color--status--warning--default)";
    case "down":
      return "var(--pf-t--global--color--status--danger--default)";
  }
}

function probeColor(status: ProbeStatus): string {
  switch (status) {
    case "success":
      return "var(--pf-t--global--color--status--success--default)";
    case "warning":
      return "var(--pf-t--global--color--status--warning--default)";
    case "danger":
      return "var(--pf-t--global--color--status--danger--default)";
  }
}

function checkDotColor(severity: string): string {
  switch (severity) {
    case "danger":
      return "var(--pf-t--global--color--status--danger--default)";
    case "success":
      return "var(--pf-t--global--color--status--success--default)";
    default:
      return "var(--pf-t--global--text--color--subtle)";
  }
}

function certStatusColor(severity: string): string | undefined {
  switch (severity) {
    case "success":
      return "var(--pf-t--global--color--status--success--default)";
    case "warning":
      return "var(--pf-t--global--color--status--warning--default)";
    default:
      return "var(--pf-t--global--text--color--subtle)";
  }
}

function statusLabelColor(status: ServiceDetail["status"]): "red" | "orange" | "green" {
  switch (status) {
    case "down":
      return "red";
    case "degraded":
      return "orange";
    case "healthy":
      return "green";
  }
}

export const ServiceDetailPanel: React.FC<IServiceDetailPanelProps> = ({ service }) => {
  const { drillDown } = service;

  return (
    <Stack hasGutter>
      {/* Header */}
      <StackItem>
        <Content component="small" style={{ color: "var(--pf-t--global--text--color--subtle)" }}>
          Service detail
        </Content>
        <Flex alignItems={{ default: "alignItemsCenter" }} spaceItems={{ default: "spaceItemsSm" }}>
          <FlexItem>
            <Icon>
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: statusColor(service.status),
                }}
              />
            </Icon>
          </FlexItem>
          <FlexItem>
            <Title headingLevel="h3">{service.name}</Title>
          </FlexItem>
          <FlexItem>
            <Label color={statusLabelColor(service.status)} isCompact>
              {service.statusText}
            </Label>
          </FlexItem>
        </Flex>
      </StackItem>

      {/* Impact alert */}
      {drillDown.impactMessage && (
        <StackItem>
          <Alert
            variant={service.status === "down" ? AlertVariant.danger : AlertVariant.warning}
            isInline
            isPlain
            title={drillDown.impactMessage}
          />
        </StackItem>
      )}

      {/* Endpoint */}
      <StackItem>
        <Content component="small" style={{ fontWeight: 500, color: "var(--pf-t--global--text--color--subtle)" }}>
          Endpoint
        </Content>
        <div
          style={{
            background: "var(--pf-t--global--background--color--secondary--default)",
            borderRadius: "var(--pf-t--global--border--radius--small)",
            padding: "var(--pf-t--global--spacer--xs) var(--pf-t--global--spacer--sm)",
            marginTop: "var(--pf-t--global--spacer--xs)",
          }}
        >
          <Content component="small" style={{ fontFamily: "var(--pf-t--global--font--family--mono)" }}>
            {drillDown.endpoint}
          </Content>
        </div>
      </StackItem>

      {/* Probe history */}
      {drillDown.probeHistory.length > 0 && (
        <StackItem>
          <Content component="small" style={{ fontWeight: 500, color: "var(--pf-t--global--text--color--subtle)" }}>
            Probe history &middot; last 1h
          </Content>
          <div
            style={{
              display: "flex",
              gap: 2,
              height: 28,
              marginTop: "var(--pf-t--global--spacer--xs)",
              alignItems: "stretch",
            }}
          >
            {drillDown.probeHistory.map((status, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  backgroundColor: probeColor(status),
                  borderRadius: 1,
                }}
              />
            ))}
          </div>
          <Flex justifyContent={{ default: "justifyContentSpaceBetween" }}>
            <FlexItem>
              <Content component="small" style={{ color: "var(--pf-t--global--text--color--subtle)" }}>
                60m ago
              </Content>
            </FlexItem>
            <FlexItem>
              <Content component="small" style={{ color: "var(--pf-t--global--text--color--subtle)" }}>
                Now
              </Content>
            </FlexItem>
          </Flex>
        </StackItem>
      )}

      {/* Certificate chain */}
      {drillDown.certChain && drillDown.certChain.length > 0 && (
        <StackItem>
          <Content component="small" style={{ fontWeight: 500, color: "var(--pf-t--global--text--color--subtle)" }}>
            Certificate chain
          </Content>
          <div
            style={{
              background: "var(--pf-t--global--background--color--secondary--default)",
              borderRadius: "var(--pf-t--global--border--radius--small)",
              padding: "var(--pf-t--global--spacer--xs) var(--pf-t--global--spacer--sm)",
              marginTop: "var(--pf-t--global--spacer--xs)",
            }}
          >
            {drillDown.certChain.map((cert, idx) => (
              <Flex
                key={idx}
                justifyContent={{ default: "justifyContentSpaceBetween" }}
                alignItems={{ default: "alignItemsCenter" }}
                style={{
                  padding: "var(--pf-t--global--spacer--xs) 0",
                  borderTop: idx > 0 ? "1px solid var(--pf-t--global--border--color--default)" : undefined,
                }}
              >
                <FlexItem>
                  <Content component="small">{cert.name}</Content>
                </FlexItem>
                <FlexItem>
                  <Content component="small" style={{ color: certStatusColor(cert.severity) }}>
                    {cert.status}
                  </Content>
                </FlexItem>
              </Flex>
            ))}
          </div>
        </StackItem>
      )}

      {/* Failing checks */}
      <StackItem>
        <Content component="small" style={{ fontWeight: 500, color: "var(--pf-t--global--text--color--subtle)" }}>
          Failing checks
        </Content>
        <Stack>
          {drillDown.failingChecks.map((check, idx) => (
            <StackItem key={idx}>
              <div
                style={{
                  padding: "var(--pf-t--global--spacer--xs) 0",
                  borderTop: idx > 0 ? "1px solid var(--pf-t--global--border--color--default)" : undefined,
                }}
              >
                <Flex alignItems={{ default: "alignItemsFlexStart" }} spaceItems={{ default: "spaceItemsSm" }}>
                  <FlexItem>
                    <span
                      style={{
                        display: "inline-block",
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: checkDotColor(check.severity),
                        marginTop: 6,
                      }}
                    />
                  </FlexItem>
                  <FlexItem>
                    <Content
                      component="small"
                      style={
                        check.severity === "subtle" ? { color: "var(--pf-t--global--text--color--subtle)" } : undefined
                      }
                    >
                      {check.name}
                    </Content>
                    <Content component="small" style={{ color: "var(--pf-t--global--text--color--subtle)" }}>
                      {check.detail}
                    </Content>
                  </FlexItem>
                </Flex>
              </div>
            </StackItem>
          ))}
        </Stack>
      </StackItem>

      {/* Action buttons */}
      <StackItem>
        <div
          style={{
            borderTop: "1px solid var(--pf-t--global--border--color--default)",
            paddingTop: "var(--pf-t--global--spacer--md)",
          }}
        >
          <Flex spaceItems={{ default: "spaceItemsSm" }}>
            <FlexItem>
              <Button variant="secondary" size="sm" icon={<ExternalLinkAltIcon />} iconPosition="end">
                View logs
              </Button>
            </FlexItem>
            <FlexItem>
              <Button variant="secondary" size="sm" icon={<ExternalLinkAltIcon />} iconPosition="end">
                Open runbook
              </Button>
            </FlexItem>
            <FlexItem>
              <Button variant="secondary" size="sm">
                Re-run probe
              </Button>
            </FlexItem>
          </Flex>
        </div>
      </StackItem>
    </Stack>
  );
};
