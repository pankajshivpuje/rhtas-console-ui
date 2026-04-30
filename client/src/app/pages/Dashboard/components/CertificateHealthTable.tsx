import React from "react";

import { Card, CardBody, CardTitle, Label } from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import type { LabelProps } from "@patternfly/react-core";

import type { CertificateInfo } from "@app/client";

function statusColor(status: string): LabelProps["color"] {
  const lower = status.toLowerCase();
  if (lower === "active") return "green";
  if (lower === "expiring") return "orange";
  return "red";
}

const statusOrder: Record<string, number> = { expired: 0, expiring: 1, active: 2 };

interface ICertificateHealthTableProps {
  certificates: CertificateInfo[];
}

export const CertificateHealthTable: React.FC<ICertificateHealthTableProps> = ({ certificates }) => {
  const sorted = [...certificates].sort(
    (a, b) => (statusOrder[a.status.toLowerCase()] ?? 3) - (statusOrder[b.status.toLowerCase()] ?? 3)
  );

  return (
    <Card>
      <CardTitle>Certificate Status</CardTitle>
      <CardBody>
        <Table aria-label="Certificate health status" variant="compact">
          <Thead>
            <Tr>
              <Th>Subject</Th>
              <Th>Type</Th>
              <Th>Expiration</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {sorted.map((cert, idx) => (
              <Tr key={idx}>
                <Td>{cert.subject}</Td>
                <Td>{cert.type}</Td>
                <Td>{cert.expiration}</Td>
                <Td>
                  <Label color={statusColor(cert.status)}>{cert.status}</Label>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );
};
