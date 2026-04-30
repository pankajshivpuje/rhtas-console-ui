import React from "react";

import {
  Card,
  CardBody,
  CardTitle,
  Content,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  Icon,
  Stack,
  StackItem,
  Title,
} from "@patternfly/react-core";

import type { ErrorRateData } from "@app/queries/health";

interface IErrorRateCardProps {
  errorRate: ErrorRateData;
}

export const ErrorRateCard: React.FC<IErrorRateCardProps> = ({ errorRate }) => {
  return (
    <Card isFullHeight>
      <CardTitle>
        <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} alignItems={{ default: "alignItemsCenter" }}>
          <FlexItem>Error rate &middot; last 1h</FlexItem>
        </Flex>
      </CardTitle>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <Grid hasGutter>
              <GridItem span={6}>
                <div
                  style={{
                    background: "var(--pf-t--global--background--color--secondary--default)",
                    borderRadius: "var(--pf-t--global--border--radius--small)",
                    padding: "var(--pf-t--global--spacer--sm)",
                  }}
                >
                  <Content component="small" style={{ color: "var(--pf-t--global--text--color--subtle)" }}>
                    Total errors
                  </Content>
                  <Title
                    headingLevel="h3"
                    size="xl"
                    style={{ color: "var(--pf-t--global--color--status--danger--default)" }}
                  >
                    {errorRate.totalErrors.toLocaleString()}
                  </Title>
                </div>
              </GridItem>
              <GridItem span={6}>
                <div
                  style={{
                    background: "var(--pf-t--global--background--color--secondary--default)",
                    borderRadius: "var(--pf-t--global--border--radius--small)",
                    padding: "var(--pf-t--global--spacer--sm)",
                  }}
                >
                  <Content component="small" style={{ color: "var(--pf-t--global--text--color--subtle)" }}>
                    Error rate
                  </Content>
                  <Title
                    headingLevel="h3"
                    size="xl"
                    style={{ color: "var(--pf-t--global--color--status--danger--default)" }}
                  >
                    {errorRate.errorRate}%
                  </Title>
                </div>
              </GridItem>
            </Grid>
          </StackItem>
          <StackItem>
            <Stack>
              {errorRate.breakdown.map((item, idx) => (
                <StackItem key={idx}>
                  <div
                    style={{
                      padding: "var(--pf-t--global--spacer--xs) 0",
                      borderTop: idx > 0 ? "1px solid var(--pf-t--global--border--color--default)" : undefined,
                    }}
                  >
                    <Flex justifyContent={{ default: "justifyContentSpaceBetween" }}>
                      <FlexItem>
                        <Content component="small" style={{ color: "var(--pf-t--global--text--color--subtle)" }}>
                          <Flex alignItems={{ default: "alignItemsCenter" }} spaceItems={{ default: "spaceItemsSm" }}>
                            {item.severity === "danger" && (
                              <FlexItem>
                                <Icon>
                                  <span
                                    style={{
                                      display: "inline-block",
                                      width: 6,
                                      height: 6,
                                      borderRadius: "50%",
                                      backgroundColor: "var(--pf-t--global--color--status--danger--default)",
                                    }}
                                  />
                                </Icon>
                              </FlexItem>
                            )}
                            <FlexItem>{item.label}</FlexItem>
                          </Flex>
                        </Content>
                      </FlexItem>
                      <FlexItem>
                        <Content
                          component="small"
                          style={{
                            fontWeight: item.severity === "danger" ? 500 : undefined,
                            color:
                              item.severity === "danger"
                                ? "var(--pf-t--global--color--status--danger--default)"
                                : undefined,
                          }}
                        >
                          {item.count.toLocaleString()}
                        </Content>
                      </FlexItem>
                    </Flex>
                  </div>
                </StackItem>
              ))}
            </Stack>
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};
