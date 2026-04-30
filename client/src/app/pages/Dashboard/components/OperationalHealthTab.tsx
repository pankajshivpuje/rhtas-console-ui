import React, { useMemo, useState } from "react";

import {
  Button,
  Content,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  Icon,
  Stack,
  StackItem,
  Switch,
} from "@patternfly/react-core";
import { SyncAltIcon } from "@patternfly/react-icons";

import { LoadingWrapper } from "@app/components/LoadingWrapper";
import { PageDrawerContent } from "@app/components/PageDrawerContext";
import {
  useFetchServiceHealth,
  useFetchExpiringAssets,
  useFetchErrorRate,
  useFetchIncidents,
  type ServiceDetail,
} from "@app/queries/health";
import {
  serviceHealthyMock,
  expiringAssetsHealthyMock,
  errorRateHealthyMock,
  incidentsHealthyMock,
} from "@app/queries/mocks/health.mock";

import { SystemHealthBanner } from "./SystemHealthBanner";
import { ServiceStatusCards } from "./ServiceStatusCards";
import { ExpiringTrustAssets } from "./ExpiringTrustAssets";
import { ErrorRateCard } from "./ErrorRateCard";
import { IncidentTimeline } from "./IncidentTimeline";
import { ServiceDetailPanel } from "./ServiceDetailPanel";

export const OperationalHealthTab: React.FC = () => {
  const { serviceHealth, isFetching: isFetchingHealth, fetchError: fetchErrorHealth } = useFetchServiceHealth();
  const { expiringAssets, isFetching: isFetchingAssets, fetchError: fetchErrorAssets } = useFetchExpiringAssets();
  const { errorRate, isFetching: isFetchingErrors, fetchError: fetchErrorErrors } = useFetchErrorRate();
  const { incidents, isFetching: isFetchingIncidents, fetchError: fetchErrorIncidents } = useFetchIncidents();

  const [selectedService, setSelectedService] = useState<ServiceDetail | null>(null);
  const [showHealthy, setShowHealthy] = useState(false);

  const isFetching = isFetchingHealth || isFetchingAssets || isFetchingErrors || isFetchingIncidents;
  const fetchError = fetchErrorHealth ?? fetchErrorAssets ?? fetchErrorErrors ?? fetchErrorIncidents;

  const activeServiceHealth = showHealthy ? serviceHealthyMock : serviceHealth;
  const activeExpiringAssets = showHealthy ? expiringAssetsHealthyMock : expiringAssets;
  const activeErrorRate = showHealthy ? errorRateHealthyMock : errorRate;
  const activeIncidents = showHealthy ? incidentsHealthyMock : incidents;

  // If the selected service was from the previous state, update it to the matching service in the new state
  const resolvedSelectedService = useMemo(() => {
    if (!selectedService || !activeServiceHealth) return null;
    return activeServiceHealth.services.find((s) => s.name === selectedService.name) ?? null;
  }, [selectedService, activeServiceHealth]);

  return (
    <>
      <PageDrawerContent
        isExpanded={resolvedSelectedService !== null}
        onCloseClick={() => setSelectedService(null)}
        focusKey={resolvedSelectedService?.name}
        pageKey="operational-health"
        header={resolvedSelectedService ? <ServiceDetailPanel service={resolvedSelectedService} /> : undefined}
      >
        {null}
      </PageDrawerContent>

      <Stack hasGutter>
        <StackItem>
          <Flex
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            alignItems={{ default: "alignItemsCenter" }}
          >
            <FlexItem>
              <Content>
                <h2 style={{ margin: 0 }}>System Health</h2>
                <Content component="small" style={{ color: "var(--pf-t--global--text--color--subtle)" }}>
                  Monitor service health, track expiring trust assets, and investigate signing failures from one place
                </Content>
              </Content>
            </FlexItem>
            <FlexItem>
              <Flex alignItems={{ default: "alignItemsCenter" }} spaceItems={{ default: "spaceItemsMd" }}>
                <FlexItem>
                  <Switch
                    id="demo-state-toggle"
                    label="All healthy"
                    labelOff="Degraded"
                    isChecked={showHealthy}
                    onChange={(_event, checked) => setShowHealthy(checked)}
                  />
                </FlexItem>
                <FlexItem>
                  <Flex alignItems={{ default: "alignItemsCenter" }} spaceItems={{ default: "spaceItemsSm" }}>
                    <FlexItem>
                      <Icon>
                        <span
                          style={{
                            display: "inline-block",
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: "var(--pf-t--global--color--status--success--default)",
                          }}
                        />
                      </Icon>
                    </FlexItem>
                    <FlexItem>
                      <Content component="small" style={{ color: "var(--pf-t--global--text--color--subtle)" }}>
                        Dashboard online
                      </Content>
                    </FlexItem>
                  </Flex>
                </FlexItem>
                <FlexItem>
                  <Content component="small" style={{ color: "var(--pf-t--global--text--color--subtle)" }}>
                    Last checked 4s ago
                  </Content>
                </FlexItem>
                <FlexItem>
                  <Button variant="secondary" size="sm" icon={<SyncAltIcon />}>
                    Refresh
                  </Button>
                </FlexItem>
              </Flex>
            </FlexItem>
          </Flex>
        </StackItem>
        <StackItem>
          <LoadingWrapper isFetching={isFetching} fetchError={fetchError}>
            <Stack hasGutter>
              {activeServiceHealth && (
                <>
                  <StackItem>
                    <SystemHealthBanner serviceHealth={activeServiceHealth} />
                  </StackItem>
                  <StackItem>
                    <ServiceStatusCards
                      services={activeServiceHealth.services}
                      onServiceClick={(service) => setSelectedService(service)}
                    />
                  </StackItem>
                </>
              )}
              <StackItem>
                <Grid hasGutter>
                  <GridItem span={6}>
                    <ExpiringTrustAssets assets={activeExpiringAssets} />
                  </GridItem>
                  <GridItem span={6}>
                    {activeErrorRate && <ErrorRateCard errorRate={activeErrorRate} />}
                  </GridItem>
                </Grid>
              </StackItem>
              {activeIncidents.length > 0 && (
                <StackItem>
                  <IncidentTimeline incidents={activeIncidents} />
                </StackItem>
              )}
            </Stack>
          </LoadingWrapper>
        </StackItem>
      </Stack>
    </>
  );
};
