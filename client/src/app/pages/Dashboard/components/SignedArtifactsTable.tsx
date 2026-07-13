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
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import type { SignedArtifact } from "@app/client";
import { formatDate } from "@app/utils/utils";

interface ISignedArtifactsTableProps {
  signedArtifacts: SignedArtifact[];
}

type FilterKey = "all" | "signed-only" | "signed-with-attestation";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "signed-only", label: "Signed only" },
  { key: "signed-with-attestation", label: "Signed + Attestation" },
];

export const SignedArtifactsTable: React.FC<ISignedArtifactsTableProps> = ({ signedArtifacts }) => {
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>("all");

  const filtered =
    selectedFilter === "all"
      ? signedArtifacts
      : selectedFilter === "signed-only"
        ? signedArtifacts.filter((a) => !a.hasAttestation)
        : signedArtifacts.filter((a) => a.hasAttestation);

  return (
    <Card>
      <CardTitle>Signed Artifacts</CardTitle>
      <CardBody>
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <ToggleGroup aria-label="Attestation filter">
                {FILTERS.map(({ key, label }) => (
                  <ToggleGroupItem
                    key={key}
                    text={label}
                    buttonId={`filter-${key}`}
                    isSelected={selectedFilter === key}
                    onChange={() => setSelectedFilter(key)}
                  />
                ))}
              </ToggleGroup>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {filtered.length === 0 ? (
          <EmptyState variant={EmptyStateVariant.sm}>
            <EmptyStateBody>No signed artifacts found.</EmptyStateBody>
          </EmptyState>
        ) : (
          <Table aria-label="Signed artifacts table">
            <Thead>
              <Tr>
                <Th>Artifact URI</Th>
                <Th>Environment</Th>
                <Th>Registry</Th>
                <Th>Attestation Status</Th>
                <Th>Last Seen</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((artifact) => (
                <Tr key={artifact.uri}>
                  <Td dataLabel="Artifact URI">{artifact.uri}</Td>
                  <Td dataLabel="Environment">
                    <Label color="grey">{artifact.environment}</Label>
                  </Td>
                  <Td dataLabel="Registry">{artifact.registry}</Td>
                  <Td dataLabel="Attestation Status">
                    <Label color={artifact.hasAttestation ? "green" : "grey"}>
                      {artifact.hasAttestation ? "Attested" : "No attestation"}
                    </Label>
                  </Td>
                  <Td dataLabel="Last Seen">{formatDate(artifact.lastSeen)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  );
};
