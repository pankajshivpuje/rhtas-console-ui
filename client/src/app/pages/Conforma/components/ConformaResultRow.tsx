import type React from "react";
import { Tr, Td } from "@patternfly/react-table";
import { Truncate } from "@patternfly/react-core";
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from "@patternfly/react-icons";
import { type UIConformaData, ConformaResultStatus } from "../types";

interface ConformaResultRowProps {
  row: UIConformaData;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const statusDisplay = (status: ConformaResultStatus) => {
  switch (status) {
    case ConformaResultStatus.Failed:
      return (
        <>
          <ExclamationCircleIcon color="var(--pf-t--global--color--status--danger--default)" /> {status}
        </>
      );
    case ConformaResultStatus.Warning:
      return (
        <>
          <ExclamationTriangleIcon color="var(--pf-t--global--color--status--warning--default)" /> {status}
        </>
      );
    case ConformaResultStatus.Success:
      return (
        <>
          <CheckCircleIcon color="var(--pf-t--global--color--status--success--default)" /> {status}
        </>
      );
  }
};

export const ConformaResultRow: React.FC<ConformaResultRowProps> = ({ row, index, isExpanded, onToggle }) => {
  return (
    <Tr>
      <Td
        expand={{
          rowIndex: index,
          isExpanded,
          onToggle,
          expandId: `conforma-row-${index}`,
        }}
      />
      <Td dataLabel="Rule">{row.title || "-"}</Td>
      <Td dataLabel="Status">{statusDisplay(row.status)}</Td>
      <Td dataLabel="Message">{row.msg ? <Truncate content={row.msg} /> : "-"}</Td>
      <Td dataLabel="Component">{row.component}</Td>
    </Tr>
  );
};
