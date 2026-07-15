import React from "react";

import { Card, CardBody, CardTitle, Content, Label, Stack, StackItem } from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { ExternalLinkAltIcon } from "@patternfly/react-icons";
import type { LabelProps } from "@patternfly/react-core";

import type { RootMetadataInfoList } from "@app/client";

function statusColor(status: string): LabelProps["color"] {
  const lower = status.toLowerCase();
  if (lower === "valid") return "green";
  if (lower === "expiring") return "orange";
  return "red";
}

interface ITufRootStatusTableProps {
  rootMetadataList: RootMetadataInfoList;
}

export const TufRootStatusTable: React.FC<ITufRootStatusTableProps> = ({ rootMetadataList }) => {
  return (
    <Card>
      <CardTitle>TUF Root Metadata</CardTitle>
      <CardBody>
        <Stack hasGutter>
          {rootMetadataList["repo-url"] && (
            <StackItem>
              <Content>
                <a href={rootMetadataList["repo-url"]} target="_blank" rel="noopener noreferrer">
                  {rootMetadataList["repo-url"]} <ExternalLinkAltIcon />
                </a>
              </Content>
            </StackItem>
          )}
          <StackItem>
            <Table aria-label="TUF root metadata status" variant="compact">
              <Thead>
                <Tr>
                  <Th>Version</Th>
                  <Th>Expires</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {(rootMetadataList.data ?? []).map((meta, idx) => (
                  <Tr key={idx}>
                    <Td>{meta.version}</Td>
                    <Td>{meta.expires}</Td>
                    <Td>
                      <Label color={statusColor(meta.status)}>{meta.status}</Label>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};
