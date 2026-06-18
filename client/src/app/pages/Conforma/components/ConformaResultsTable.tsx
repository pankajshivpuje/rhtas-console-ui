import type React from "react";
import { useState, useMemo, useCallback } from "react";
import {
  Badge,
  Bullseye,
  Content,
  SearchInput,
  Select,
  SelectGroup,
  SelectList,
  SelectOption,
  MenuToggle,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarItem,
} from "@patternfly/react-core";
import { FilterIcon } from "@patternfly/react-icons";
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  ExpandableRowContent,
  type ThProps,
} from "@patternfly/react-table";
import {
  type UIConformaData,
  type ConformaResultStatus,
  ConformaResultStatus as Status,
} from "../types";
import { ConformaResultRow } from "./ConformaResultRow";
import { ConformaExpandedRow } from "./ConformaExpandedRow";

interface ConformaResultsTableProps {
  results: UIConformaData[];
}

const STATUS_SORT_ORDER: ConformaResultStatus[] = [
  Status.Failed,
  Status.Warning,
  Status.Success,
];

const STATUS_OPTIONS: ConformaResultStatus[] = [
  Status.Failed,
  Status.Warning,
  Status.Success,
];

export const ConformaResultsTable: React.FC<ConformaResultsTableProps> = ({
  results,
}) => {
  const [activeSortIndex, setActiveSortIndex] = useState<number>(1);
  const [activeSortDirection, setActiveSortDirection] = useState<
    "asc" | "desc"
  >("asc");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const [ruleFilter, setRuleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ConformaResultStatus[]>([]);
  const [statusSelectOpen, setStatusSelectOpen] = useState(false);

  const onStatusSelect = useCallback(
    (_event: React.MouseEvent | undefined, value: string | number | undefined) => {
      const v = String(value) as ConformaResultStatus;
      setStatusFilter((prev) =>
        prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v],
      );
    },
    [],
  );

  const clearAllFilters = useCallback(() => {
    setRuleFilter("");
    setStatusFilter([]);
  }, []);

  const filteredResults = useMemo(() => {
    const ruleLower = ruleFilter.trim().toLowerCase();
    return results.filter((row) => {
      if (ruleLower && !row.title.toLowerCase().includes(ruleLower)) {
        return false;
      }
      if (statusFilter.length && !statusFilter.includes(row.status)) {
        return false;
      }
      return true;
    });
  }, [results, ruleFilter, statusFilter]);

  const sortedResults = useMemo(() => {
    const keys = ["title", "status", "msg", "component"] as const;
    const key = keys[activeSortIndex];
    return [...filteredResults].sort((a, b) => {
      if (key === "status") {
        const ai = STATUS_SORT_ORDER.indexOf(a.status);
        const bi = STATUS_SORT_ORDER.indexOf(b.status);
        return activeSortDirection === "asc" ? ai - bi : bi - ai;
      }
      const av = (a[key] ?? "") as string;
      const bv = (b[key] ?? "") as string;
      return activeSortDirection === "asc"
        ? av.localeCompare(bv)
        : bv.localeCompare(av);
    });
  }, [filteredResults, activeSortIndex, activeSortDirection]);

  const getSortParams = (columnIndex: number): ThProps["sort"] => ({
    sortBy: {
      index: activeSortIndex,
      direction: activeSortDirection,
    },
    onSort: (_event, index, direction) => {
      setActiveSortIndex(index);
      setActiveSortDirection(direction);
    },
    columnIndex,
  });

  const toggleExpand = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const hasActiveFilters = ruleFilter.trim() !== "" || statusFilter.length > 0;

  return (
    <>
      <Toolbar clearAllFilters={clearAllFilters}>
        <ToolbarContent>
          <ToolbarItem>
            <SearchInput
              aria-label="Filter by rule name"
              placeholder="Filter by rule..."
              value={ruleFilter}
              onChange={(_event, value) => setRuleFilter(value)}
              onClear={() => setRuleFilter("")}
            />
          </ToolbarItem>
          <ToolbarItem>
            <ToolbarFilter
              labels={statusFilter}
              deleteLabel={(_category, label) =>
                setStatusFilter((prev) =>
                  prev.filter((s) => s !== (label as string)),
                )
              }
              deleteLabelGroup={() => setStatusFilter([])}
              categoryName="Status"
            >
              <Select
                role="menu"
                isOpen={statusSelectOpen}
                selected={statusFilter}
                onSelect={onStatusSelect}
                onOpenChange={setStatusSelectOpen}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setStatusSelectOpen(!statusSelectOpen)}
                    isExpanded={statusSelectOpen}
                    icon={<FilterIcon />}
                  >
                    Status
                    {statusFilter.length > 0 && (
                      <>
                        {" "}
                        <Badge isRead>{statusFilter.length}</Badge>
                      </>
                    )}
                  </MenuToggle>
                )}
              >
                <SelectGroup label="Status">
                  <SelectList>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectOption
                        hasCheckbox
                        key={status}
                        value={status}
                        isSelected={statusFilter.includes(status)}
                      >
                        {status}
                      </SelectOption>
                    ))}
                  </SelectList>
                </SelectGroup>
              </Select>
            </ToolbarFilter>
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      {hasActiveFilters && sortedResults.length === 0 ? (
        <Bullseye>
          <Content component="p">
            No results match the current filters.
          </Content>
        </Bullseye>
      ) : (
        <Table aria-label="Conforma evaluation results" variant="compact">
          <Thead>
            <Tr>
              <Th screenReaderText="Row expansion" />
              <Th sort={getSortParams(0)}>Rule</Th>
              <Th sort={getSortParams(1)}>Status</Th>
              <Th sort={getSortParams(2)}>Message</Th>
              <Th sort={getSortParams(3)}>Component</Th>
            </Tr>
          </Thead>
          {sortedResults.map((row, index) => (
            <Tbody key={index} isExpanded={expandedRows.has(index)}>
              <ConformaResultRow
                row={row}
                index={index}
                isExpanded={expandedRows.has(index)}
                onToggle={() => toggleExpand(index)}
              />
              {expandedRows.has(index) && (
                <Tr isExpanded>
                  <Td colSpan={5}>
                    <ExpandableRowContent>
                      <ConformaExpandedRow data={row} />
                    </ExpandableRowContent>
                  </Td>
                </Tr>
              )}
            </Tbody>
          ))}
        </Table>
      )}
    </>
  );
};
