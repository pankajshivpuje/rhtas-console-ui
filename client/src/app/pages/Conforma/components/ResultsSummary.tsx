import type React from "react";
import { Flex, FlexItem, Content } from "@patternfly/react-core";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from "@patternfly/react-icons";
import { ConformaResultStatus, type UIConformaData } from "../types";

interface ResultsSummaryProps {
  results: UIConformaData[];
}

const statusIcon = (status: ConformaResultStatus) => {
  switch (status) {
    case ConformaResultStatus.Failed:
      return (
        <ExclamationCircleIcon color="var(--pf-t--global--color--status--danger--default)" />
      );
    case ConformaResultStatus.Warning:
      return (
        <ExclamationTriangleIcon color="var(--pf-t--global--color--status--warning--default)" />
      );
    case ConformaResultStatus.Success:
      return (
        <CheckCircleIcon color="var(--pf-t--global--color--status--success--default)" />
      );
  }
};

export const ResultsSummary: React.FC<ResultsSummaryProps> = ({ results }) => {
  const counts = results.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {} as Record<ConformaResultStatus, number>,
  );

  return (
    <Flex spaceItems={{ default: "spaceItemsXl" }}>
      {[
        ConformaResultStatus.Failed,
        ConformaResultStatus.Warning,
        ConformaResultStatus.Success,
      ].map((status) => (
        <FlexItem key={status}>
          <Content component="p">
            {statusIcon(status)}{" "}
            <strong>{counts[status] ?? 0}</strong> {status}
          </Content>
        </FlexItem>
      ))}
    </Flex>
  );
};
