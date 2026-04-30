import { Fragment } from "react";

import {
  Button,
  EmptyState,
  EmptyStateBody,
  Label,
  PageSection,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { Table, Thead, Tbody, Tr, Th, Td } from "@patternfly/react-table";
import { CheckCircleIcon, ExclamationCircleIcon, InfoCircleIcon } from "@patternfly/react-icons";

import { DocumentMetadata } from "@app/components/DocumentMetadata";
import { SimplePagination } from "@app/components/SimplePagination";
import { MultiselectFilterControl } from "@app/components/FilterToolbar/MultiselectFilterControl";
import { usePFToolbarTable } from "@app/hooks/usePFToolbarTable";
import { type WithUiId, useWithUiId } from "@app/hooks/query-utils";
import { useFetchAlerts, useAcknowledgeAlert, type Alert } from "@app/queries/alerts";

const severityOptions = [
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
];

const statusOptions = [
  { value: "firing", label: "Firing" },
  { value: "resolved", label: "Resolved" },
];

const SeverityLabel = ({ severity }: { severity: string }) => {
  switch (severity) {
    case "critical":
      return <Label color="red" icon={<ExclamationCircleIcon />}>Critical</Label>;
    case "warning":
      return <Label color="orange" icon={<ExclamationCircleIcon />}>Warning</Label>;
    case "info":
      return <Label color="blue" icon={<InfoCircleIcon />}>Info</Label>;
    default:
      return <Label>{severity}</Label>;
  }
};

const StatusLabel = ({ status }: { status: string }) => {
  switch (status) {
    case "firing":
      return <Label color="red">Firing</Label>;
    case "resolved":
      return <Label color="green" icon={<CheckCircleIcon />}>Resolved</Label>;
    default:
      return <Label>{status}</Label>;
  }
};

const formatRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const AcknowledgeButton = ({ alert }: { alert: Alert }) => {
  const { acknowledge, isAcknowledging } = useAcknowledgeAlert();

  if (alert.acknowledged) {
    return (
      <Label color="green" icon={<CheckCircleIcon />}>
        Acknowledged
        {alert.acknowledgedBy ? ` by ${alert.acknowledgedBy}` : ""}
      </Label>
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      isLoading={isAcknowledging}
      isDisabled={isAcknowledging}
      onClick={() => acknowledge(alert.id)}
    >
      Acknowledge
    </Button>
  );
};

const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };

export const Alerts = () => {
  const { alerts, isFetching } = useFetchAlerts();

  const items = useWithUiId(alerts, (item) => item.id);

  const precurrentPageItems = [...items].sort((a, b) => {
    const sevDiff = (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3);
    if (sevDiff !== 0) return sevDiff;
    return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
  });

  const tableState = usePFToolbarTable({
    items: precurrentPageItems,
    idProperty: "_ui_unique_id",
    columns: [],
    toolbar: {
      categoryTitles: {
        severity: "Severity",
        status: "Status",
      },
    },
    filtering: {
      initialFilterValues: { status: ["firing"] },
      filterCategories: [
        {
          categoryKey: "severity",
          matcher: (filterValue, item) => item.severity === filterValue,
          logicOperator: "OR",
        },
        {
          categoryKey: "status",
          matcher: (filterValue, item) => item.status === filterValue,
          logicOperator: "OR",
        },
      ],
    },
  });

  const {
    tableState: { currentPageItems },
    propHelpers: { paginationProps, paginationToolbarItemProps, getFilterControlProps, toolbarProps },
  } = tableState;

  const tableColumns = ["Severity", "Alert Name", "Summary", "Status", "Started", "Actions"];

  return (
    <Fragment>
      <DocumentMetadata title="Alerts" />
      <PageSection>
        <Title headingLevel="h1" size="lg">
          Alerts
        </Title>
      </PageSection>
      <PageSection>
        <Toolbar {...toolbarProps} aria-label="Alerts toolbar">
          <ToolbarContent>
            <ToolbarItem>
              <MultiselectFilterControl
                {...getFilterControlProps({ categoryKey: "severity" })}
                selectOptions={severityOptions}
                placeholderText="Filter by severity"
                showToolbarItem
              />
            </ToolbarItem>
            <ToolbarItem>
              <MultiselectFilterControl
                {...getFilterControlProps({ categoryKey: "status" })}
                selectOptions={statusOptions}
                placeholderText="Filter by status"
                showToolbarItem
              />
            </ToolbarItem>
            <ToolbarItem {...paginationToolbarItemProps}>
              <SimplePagination idPrefix="alerts-table" isTop paginationProps={paginationProps} />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {currentPageItems.length === 0 ? (
          <EmptyState>
            <EmptyStateBody>
              {isFetching ? "Loading alerts..." : "No alerts match the current filters."}
            </EmptyStateBody>
          </EmptyState>
        ) : (
          <Table aria-label="Alerts table">
            <Thead>
              <Tr>
                {tableColumns.map((column) => (
                  <Th key={column}>{column}</Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {currentPageItems.map((alert: WithUiId<Alert>) => (
                <Tr key={alert._ui_unique_id}>
                  <Td dataLabel="Severity">
                    <SeverityLabel severity={alert.severity} />
                  </Td>
                  <Td dataLabel="Alert Name">{alert.alertName}</Td>
                  <Td dataLabel="Summary">{alert.summary}</Td>
                  <Td dataLabel="Status">
                    <StatusLabel status={alert.status} />
                  </Td>
                  <Td dataLabel="Started">{formatRelativeTime(alert.startsAt)}</Td>
                  <Td dataLabel="Actions">
                    <AcknowledgeButton alert={alert} />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}

        <SimplePagination idPrefix="alerts-table" isTop={false} paginationProps={paginationProps} />
      </PageSection>
    </Fragment>
  );
};
