import React, { useState } from "react";

import {
  Card,
  CardBody,
  CardTitle,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  Label,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToggleGroup,
  ToggleGroupItem,
} from "@patternfly/react-core";
import { CheckCircleIcon } from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import type { UnsignedArtifact } from "@app/client";
import { formatDate } from "@app/utils/utils";

interface IUnsignedArtifactsTableProps {
  unsignedArtifacts: UnsignedArtifact[];
}

const ENVIRONMENTS = ["all", "production", "staging", "dev"] as const;

export const UnsignedArtifactsTable: React.FC<IUnsignedArtifactsTableProps> = ({ unsignedArtifacts }) => {
  const [selectedEnv, setSelectedEnv] = useState<string>("all");

  const filtered =
    selectedEnv === "all" ? unsignedArtifacts : unsignedArtifacts.filter((a) => a.environment === selectedEnv);

  return (
    <Card style={{ marginTop: "var(--pf-t--global--spacer--md)" }}>
      <CardTitle>Unsigned Artifacts</CardTitle>
      <CardBody>
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <ToggleGroup aria-label="Environment filter">
                {ENVIRONMENTS.map((env) => (
                  <ToggleGroupItem
                    key={env}
                    text={env.charAt(0).toUpperCase() + env.slice(1)}
                    buttonId={`env-filter-${env}`}
                    isSelected={selectedEnv === env}
                    onChange={() => setSelectedEnv(env)}
                  />
                ))}
              </ToggleGroup>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {filtered.length === 0 ? (
          <EmptyState variant={EmptyStateVariant.sm} icon={CheckCircleIcon}>
            <EmptyStateBody>
              {selectedEnv === "all"
                ? "All artifacts are signed. Great job!"
                : `No unsigned artifacts in ${selectedEnv}.`}
            </EmptyStateBody>
          </EmptyState>
        ) : (
          <Table aria-label="Unsigned artifacts table">
            <Thead>
              <Tr>
                <Th>Artifact URI</Th>
                <Th>Environment</Th>
                <Th>Registry</Th>
                <Th>Last Seen</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((artifact) => (
                <Tr key={artifact.uri}>
                  <Td data-label="Artifact URI">{artifact.uri}</Td>
                  <Td data-label="Environment">
                    <Label color={artifact.environment === "production" ? "red" : "grey"}>{artifact.environment}</Label>
                  </Td>
                  <Td data-label="Registry">{artifact.registry}</Td>
                  <Td data-label="Last Seen">{formatDate(artifact.lastSeen)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  );
};
