import React, { Fragment, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  Breadcrumb,
  BreadcrumbItem,
  Content,
  FormSelect,
  FormSelectOption,
  Label,
  PageSection,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { DocumentMetadata } from "@app/components/DocumentMetadata";
import { Paths } from "@app/Routes";

interface ArtifactRow {
  uri: string;
  environment: string;
  registry: string;
  status: "signed" | "unsigned" | "partially signed";
  lastSeen: string;
}

const allArtifactRows: ArtifactRow[] = [
  { uri: "quay.io/myorg/api-gateway:2.3.1", environment: "rhtas-production", registry: "quay.io", status: "signed", lastSeen: "2026-03-10T10:00:00Z" },
  { uri: "quay.io/myorg/checkout-svc:1.8.0", environment: "rhtas-production", registry: "quay.io", status: "signed", lastSeen: "2026-03-10T09:30:00Z" },
  { uri: "quay.io/myorg/billing-service:1.4.2", environment: "rhtas-production", registry: "quay.io", status: "unsigned", lastSeen: "2026-03-09T14:22:00Z" },
  { uri: "quay.io/myorg/auth-proxy:2.0.1", environment: "rhtas-production", registry: "quay.io", status: "unsigned", lastSeen: "2026-03-08T09:15:00Z" },
  { uri: "quay.io/myorg/user-service:3.0.0", environment: "rhtas-production", registry: "quay.io", status: "signed", lastSeen: "2026-03-10T08:45:00Z" },
  { uri: "quay.io/myorg/notification-svc:1.2.4", environment: "rhtas-production", registry: "quay.io", status: "partially signed", lastSeen: "2026-03-09T16:00:00Z" },
  { uri: "registry.example.com/frontend:3.1.0-rc1", environment: "rhtas-staging", registry: "registry.example.com", status: "unsigned", lastSeen: "2026-03-09T18:45:00Z" },
  { uri: "registry.example.com/frontend:3.0.9", environment: "rhtas-staging", registry: "registry.example.com", status: "signed", lastSeen: "2026-03-08T12:00:00Z" },
  { uri: "registry.example.com/search-indexer:2.1.0", environment: "rhtas-staging", registry: "registry.example.com", status: "signed", lastSeen: "2026-03-09T11:20:00Z" },
  { uri: "registry.example.com/cache-layer:1.0.3", environment: "rhtas-staging", registry: "registry.example.com", status: "partially signed", lastSeen: "2026-03-07T15:10:00Z" },
  { uri: "registry.example.com/data-pipeline:0.9.0", environment: "rhtas-dev", registry: "registry.example.com", status: "unsigned", lastSeen: "2026-03-07T11:30:00Z" },
  { uri: "ghcr.io/myorg/monitoring-agent:latest", environment: "rhtas-dev", registry: "ghcr.io", status: "unsigned", lastSeen: "2026-03-06T16:00:00Z" },
  { uri: "ghcr.io/myorg/log-collector:0.5.2", environment: "rhtas-dev", registry: "ghcr.io", status: "signed", lastSeen: "2026-03-09T13:00:00Z" },
  { uri: "ghcr.io/myorg/dev-tools:1.1.0", environment: "rhtas-dev", registry: "ghcr.io", status: "partially signed", lastSeen: "2026-03-08T10:45:00Z" },
  { uri: "quay.io/myorg/tas-controller:4.0.0", environment: "trusted-artifact-signer", registry: "quay.io", status: "signed", lastSeen: "2026-03-10T07:00:00Z" },
  { uri: "quay.io/myorg/tas-webhook:3.2.1", environment: "trusted-artifact-signer", registry: "quay.io", status: "signed", lastSeen: "2026-03-09T22:30:00Z" },
  { uri: "quay.io/myorg/tas-cli:2.5.0", environment: "trusted-artifact-signer", registry: "quay.io", status: "partially signed", lastSeen: "2026-03-08T19:00:00Z" },
];

const ENVIRONMENT_OPTIONS = [
  { value: "", label: "All environments" },
  { value: "rhtas-production", label: "rhtas-production" },
  { value: "rhtas-staging", label: "rhtas-staging" },
  { value: "rhtas-dev", label: "rhtas-dev" },
  { value: "trusted-artifact-signer", label: "trusted-artifact-signer" },
];

function statusColor(status: ArtifactRow["status"]): "green" | "red" | "orange" {
  if (status === "signed") return "green";
  if (status === "unsigned") return "red";
  return "orange";
}

export const TotalArtifacts: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialEnv = searchParams.get("environment") ?? "";
  const [envFilter, setEnvFilter] = useState(initialEnv);

  const artifacts = envFilter
    ? allArtifactRows.filter((a) => a.environment === envFilter)
    : allArtifactRows;

  return (
    <Fragment>
      <DocumentMetadata title="All Artifacts" />
      <PageSection variant="default">
        <Breadcrumb>
          <BreadcrumbItem to={Paths.dashboard}>Trust Coverage</BreadcrumbItem>
          <BreadcrumbItem isActive>All Artifacts</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>
      <PageSection variant="default">
        <Content>
          <h1>All Artifacts</h1>
          <p>{artifacts.length} artifacts tracked{envFilter ? ` in ${envFilter}` : ""}.</p>
        </Content>
      </PageSection>
      <PageSection>
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "var(--pf-t--global--spacer--sm)" }}>
                <label htmlFor="artifact-env-filter">Environment</label>
                <div style={{ width: "fit-content" }}>
                  <FormSelect
                    id="artifact-env-filter"
                    value={envFilter}
                    onChange={(_event, value) => setEnvFilter(value)}
                    aria-label="Filter by environment"
                  >
                    {ENVIRONMENT_OPTIONS.map((opt) => (
                      <FormSelectOption key={opt.value} value={opt.value} label={opt.label} />
                    ))}
                  </FormSelect>
                </div>
              </div>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
        <Table aria-label="Total artifacts table">
          <Thead>
            <Tr>
              <Th>Artifact URI</Th>
              <Th>Environment</Th>
              <Th>Registry</Th>
              <Th>Status</Th>
              <Th>Last Seen</Th>
            </Tr>
          </Thead>
          <Tbody>
            {artifacts.map((artifact) => (
              <Tr key={artifact.uri}>
                <Td dataLabel="Artifact URI">{artifact.uri}</Td>
                <Td dataLabel="Environment">{artifact.environment}</Td>
                <Td dataLabel="Registry">{artifact.registry}</Td>
                <Td dataLabel="Status">
                  <Label color={statusColor(artifact.status)}>{artifact.status}</Label>
                </Td>
                <Td dataLabel="Last Seen">{new Date(artifact.lastSeen).toLocaleString()}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </PageSection>
    </Fragment>
  );
};

export default TotalArtifacts;
