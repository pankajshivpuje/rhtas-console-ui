import React, { useMemo, useState } from "react";

import { Button, Content, Flex, FlexItem, Grid, GridItem, Stack, StackItem } from "@patternfly/react-core";
import { SyncAltIcon } from "@patternfly/react-icons";
import { useQueryClient } from "@tanstack/react-query";

import { LoadingWrapper } from "@app/components/LoadingWrapper";
import { PageDrawerContent } from "@app/components/PageDrawerContext";
import { useMockHealth } from "@app/components/mockHealthContext";
import ENV from "@app/env";
import {
  HealthKeys,
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
  serviceDegradedMock,
  expiringAssetsDegradedMock,
  errorRateDegradedMock,
  incidentsDegradedMock,
} from "@app/queries/mocks/health.mock";

import { SystemHealthBanner } from "./SystemHealthBanner";
import { ServiceStatusCards } from "./ServiceStatusCards";
import { ExpiringTrustAssets } from "./ExpiringTrustAssets";
import { ErrorRateCard } from "./ErrorRateCard";
import { IncidentTimeline } from "./IncidentTimeline";
import { ServiceDetailPanel } from "./ServiceDetailPanel";

export const OperationalHealthTab: React.FC = () => {
  const {
    serviceHealth,
    isFetching: isFetchingHealth,
    isRefreshing,
    dataUpdatedAt,
    fetchError: fetchErrorHealth,
  } = useFetchServiceHealth();
  const queryClient = useQueryClient();
  const { expiringAssets, isFetching: isFetchingAssets, fetchError: fetchErrorAssets } = useFetchExpiringAssets();
  const { errorRate, isFetching: isFetchingErrors, fetchError: fetchErrorErrors } = useFetchErrorRate();
  const { incidents, isFetching: isFetchingIncidents, fetchError: fetchErrorIncidents } = useFetchIncidents();

  const [selectedService, setSelectedService] = useState<ServiceDetail | null>(null);
  const { scenario } = useMockHealth();

  const isFetching = isFetchingAssets || isFetchingErrors || isFetchingIncidents;
  const fetchError = fetchErrorAssets ?? fetchErrorErrors ?? fetchErrorIncidents;

  const useScenario = ENV.MOCK !== "off" && scenario !== "down";
  const isHealthyScenario = scenario === "healthy";
  const activeServiceHealth = useScenario
    ? isHealthyScenario
      ? serviceHealthyMock
      : serviceDegradedMock
    : serviceHealth;
  const activeExpiringAssets = useScenario
    ? isHealthyScenario
      ? expiringAssetsHealthyMock
      : expiringAssetsDegradedMock
    : expiringAssets;
  const activeErrorRate = useScenario ? (isHealthyScenario ? errorRateHealthyMock : errorRateDegradedMock) : errorRate;
  const activeIncidents = useScenario ? (isHealthyScenario ? incidentsHealthyMock : incidentsDegradedMock) : incidents;

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
          <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} alignItems={{ default: "alignItemsCenter" }}>
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
                {dataUpdatedAt > 0 && !fetchErrorHealth && !useScenario && (
                  <FlexItem>
                    <Content component="small" style={{ color: "var(--pf-t--global--text--color--subtle)" }}>
                      {ENV.MOCK !== "off" ? "Mock data · Updated " : "Updated "}
                      <time dateTime={new Date(dataUpdatedAt).toISOString()}>
                        {new Date(dataUpdatedAt).toLocaleTimeString()}
                      </time>
                    </Content>
                  </FlexItem>
                )}
                <FlexItem>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<SyncAltIcon />}
                    isDisabled={isRefreshing}
                    onClick={() => void queryClient.refetchQueries({ queryKey: HealthKeys.all })}
                  >
                    Refresh
                  </Button>
                </FlexItem>
              </Flex>
            </FlexItem>
          </Flex>
        </StackItem>
        <StackItem>
          <SystemHealthBanner
            serviceHealth={activeServiceHealth}
            isLoading={isFetchingHealth && !useScenario}
            hasError={Boolean(fetchErrorHealth) && !useScenario}
          />
        </StackItem>
        {activeServiceHealth && (!fetchErrorHealth || useScenario) && (
          <StackItem>
            <ServiceStatusCards
              services={activeServiceHealth.services}
              onServiceClick={(service) => setSelectedService(service)}
            />
          </StackItem>
        )}
        <StackItem>
          <LoadingWrapper isFetching={isFetching} fetchError={fetchError}>
            <Stack hasGutter>
              <StackItem>
                <Grid hasGutter>
                  <GridItem span={6}>
                    <ExpiringTrustAssets assets={activeExpiringAssets} />
                  </GridItem>
                  <GridItem span={6}>{activeErrorRate && <ErrorRateCard errorRate={activeErrorRate} />}</GridItem>
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
