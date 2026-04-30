import React, { Fragment } from "react";

import {
  Content,
  Flex,
  FlexItem,
  PageSection,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { ExternalLinkAltIcon } from "@patternfly/react-icons";

import { DocumentMetadata } from "@app/components/DocumentMetadata";
import { LoadingWrapper } from "@app/components/LoadingWrapper";
import {
  useFetchAttestationCoverage,
  useFetchPostureSummary,
  useFetchPostureTrend,
  useFetchUnsignedArtifacts,
} from "@app/queries/dashboard";

import { AttestationCoverageChart } from "./components/AttestationCoverageChart";
import { PostureSummaryCards } from "./components/PostureSummaryCards";
import { SigningDonut } from "./components/SigningDonut";
import { UnsignedArtifactsTable } from "./components/UnsignedArtifactsTable";
import { PostureTrendChart } from "./components/PostureTrendChart";

export const Dashboard: React.FC = () => {
  const {
    summary,
    isFetching: isFetchingSummary,
    fetchError: fetchErrorSummary,
  } = useFetchPostureSummary();
  const {
    unsignedArtifacts,
    isFetching: isFetchingUnsigned,
    fetchError: fetchErrorUnsigned,
  } = useFetchUnsignedArtifacts();
  const {
    trend,
    isFetching: isFetchingTrend,
    fetchError: fetchErrorTrend,
  } = useFetchPostureTrend();
  const {
    attestationCoverage,
    isFetching: isFetchingAttestation,
    fetchError: fetchErrorAttestation,
  } = useFetchAttestationCoverage();

  const isFetching = isFetchingSummary || isFetchingUnsigned || isFetchingTrend || isFetchingAttestation;
  const fetchError = fetchErrorSummary ?? fetchErrorUnsigned ?? fetchErrorTrend ?? fetchErrorAttestation;

  return (
    <Fragment>
      <DocumentMetadata title="Dashboard" />
      <PageSection>
        <Stack hasGutter>
          <StackItem>
            <Content>
              <h2>Trust Coverage</h2>
              <p>
                Fleet-level visibility into artifact signing coverage and attestation status.{" "}
                <a href="https://github.com/securesign/sigstore-ocp" target="_blank" rel="noopener noreferrer">
                  securesign/sigstore-ocp <ExternalLinkAltIcon />
                </a>
              </p>
            </Content>
          </StackItem>
          <StackItem>
            <LoadingWrapper isFetching={isFetching} fetchError={fetchError}>
              {summary && (
                <Stack hasGutter>
                  <StackItem>
                    <PostureSummaryCards summary={summary} />
                  </StackItem>
                  <StackItem>
                    <Flex alignItems={{ default: "alignItemsStretch" }}>
                      <FlexItem flex={{ default: "flex_1" }}>
                        <SigningDonut summary={summary} />
                      </FlexItem>
                      <FlexItem flex={{ default: "flex_2" }}>
                        <PostureTrendChart trend={trend} />
                      </FlexItem>
                    </Flex>
                  </StackItem>
                  <StackItem>
                    <AttestationCoverageChart attestationCoverage={attestationCoverage} />
                  </StackItem>
                  <StackItem>
                    <UnsignedArtifactsTable unsignedArtifacts={unsignedArtifacts} />
                  </StackItem>
                </Stack>
              )}
            </LoadingWrapper>
          </StackItem>
        </Stack>
      </PageSection>
    </Fragment>
  );
};
