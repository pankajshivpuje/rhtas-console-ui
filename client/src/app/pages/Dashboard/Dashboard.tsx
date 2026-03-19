import React, { Fragment, useState } from "react";

import { Content, Divider, Flex, FlexItem, FormSelect, FormSelectOption, PageSection } from "@patternfly/react-core";

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

const NAMESPACES = [
  { value: "", label: "All environments" },
  { value: "rhtas-production", label: "rhtas-production" },
  { value: "rhtas-staging", label: "rhtas-staging" },
  { value: "rhtas-dev", label: "rhtas-dev" },
  { value: "trusted-artifact-signer", label: "trusted-artifact-signer" },
];

export const Dashboard: React.FC = () => {
  const [namespace, setNamespace] = useState("");

  const selectedNamespace = namespace || undefined;
  const { summary, isFetching: isFetchingSummary, fetchError: fetchErrorSummary } = useFetchPostureSummary({ environment: selectedNamespace });
  const {
    unsignedArtifacts,
    isFetching: isFetchingUnsigned,
    fetchError: fetchErrorUnsigned,
  } = useFetchUnsignedArtifacts({ environment: selectedNamespace });
  const { trend, isFetching: isFetchingTrend, fetchError: fetchErrorTrend } = useFetchPostureTrend({ environment: selectedNamespace });
  const {
    attestationCoverage,
    isFetching: isFetchingAttestation,
    fetchError: fetchErrorAttestation,
  } = useFetchAttestationCoverage({ environment: selectedNamespace });

  const isFetching = isFetchingSummary || isFetchingUnsigned || isFetchingTrend || isFetchingAttestation;
  const fetchError = fetchErrorSummary ?? fetchErrorUnsigned ?? fetchErrorTrend ?? fetchErrorAttestation;

  return (
    <Fragment>
      <DocumentMetadata title="Trust Coverage" />
      <PageSection variant="default" style={{ paddingBottom: "var(--pf-t--global--spacer--md)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "var(--pf-t--global--spacer--sm)" }}>
          <label htmlFor="namespace-filter">Environment</label>
          <div style={{ width: "fit-content" }}>
            <FormSelect
              id="namespace-filter"
              value={namespace}
              onChange={(_event, value) => setNamespace(value)}
              aria-label="Filter by environment"
            >
              {NAMESPACES.map((ns) => (
                <FormSelectOption key={ns.value} value={ns.value} label={ns.label} />
              ))}
            </FormSelect>
          </div>
        </div>
      </PageSection>
      <Divider />
      <PageSection variant="default">
        <Content>
          <h1>Trust Coverage</h1>
          <p>Fleet-level visibility into artifact signing coverage and attestation status.</p>
        </Content>
      </PageSection>
      <PageSection>
        <LoadingWrapper isFetching={isFetching} fetchError={fetchError}>
          {summary && (
            <>
              <PostureSummaryCards summary={summary} environment={selectedNamespace} />
              <Flex alignItems={{ default: "alignItemsStretch" }}>
                <FlexItem flex={{ default: "flex_1" }}>
                  <SigningDonut summary={summary} />
                </FlexItem>
                <FlexItem flex={{ default: "flex_2" }}>
                  <PostureTrendChart trend={trend} />
                </FlexItem>
              </Flex>
              <AttestationCoverageChart attestationCoverage={attestationCoverage} />
              <UnsignedArtifactsTable unsignedArtifacts={unsignedArtifacts} />
            </>
          )}
        </LoadingWrapper>
      </PageSection>
    </Fragment>
  );
};
