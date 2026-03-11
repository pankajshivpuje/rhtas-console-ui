import { Fragment } from "react";
import { Link } from "react-router-dom";
import type { LogEntry } from "rekor";
import dayjs from "dayjs";
import { Table, Thead, Tbody, Tr, Th, Td } from "@patternfly/react-table";
import {
  Icon,
  Label,
  Pagination,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Truncate,
} from "@patternfly/react-core";
import { CheckCircleIcon, ExternalLinkAltIcon } from "@patternfly/react-icons";
import type { RekorEntries } from "../api/rekor-api";
import { Paths } from "@app/Routes";

const PAGE_SIZE = 20;

interface RowData {
  uuid: string;
  logIndex: number;
  integratedTime: number;
  kind: string;
  hash: string;
  signature: string;
  hasCertificate: boolean;
}

function extractRowData(entry: LogEntry): RowData {
  const [uuid, obj] = Object.entries(entry)[0];
  const body = JSON.parse(window.atob(obj.body)) as {
    kind: string;
    apiVersion: string;
    spec: Record<string, unknown>;
  };

  let hash = "";
  let signature = "";
  let hasCertificate = false;

  switch (body.kind) {
    case "hashedrekord": {
      const spec = body.spec as {
        data?: { hash?: { algorithm?: string; value?: string } };
        signature?: { content?: string; publicKey?: { content?: string } };
      };
      hash = spec.data?.hash?.value
        ? `${spec.data.hash.algorithm ?? "sha256"}:${spec.data.hash.value}`
        : "";
      signature = spec.signature?.content ?? "";
      hasCertificate = !!spec.signature?.publicKey?.content;
      break;
    }
    case "intoto": {
      const spec = body.spec as {
        content?: { payloadHash?: { algorithm?: string; value?: string } };
        publicKey?: string;
      };
      hash = spec.content?.payloadHash?.value
        ? `${spec.content.payloadHash.algorithm ?? "sha256"}:${spec.content.payloadHash.value}`
        : "";
      hasCertificate = !!spec.publicKey;
      break;
    }
    case "dsse": {
      const spec = body.spec as {
        payloadHash?: { algorithm?: string; value?: string };
        signatures?: Array<{ signature?: string; verifier?: string }>;
      };
      hash = spec.payloadHash?.value
        ? `${spec.payloadHash.algorithm ?? "sha256"}:${spec.payloadHash.value}`
        : "";
      const sig = spec.signatures?.[0];
      signature = sig?.signature ?? "";
      hasCertificate = !!sig?.verifier;
      break;
    }
  }

  return {
    uuid,
    logIndex: obj.logIndex,
    integratedTime: obj.integratedTime,
    kind: body.kind,
    hash,
    signature,
    hasCertificate,
  };
}

function formatDate(timestamp: number): string {
  return dayjs(timestamp * 1000).format("MMM DD, YYYY");
}

export function ResultsTable({
  rekorEntries,
  page,
  onSetPage,
}: {
  rekorEntries: RekorEntries;
  page: number;
  onSetPage: (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    _newPage: number,
  ) => void;
}) {
  const rows = rekorEntries.entries.map(extractRowData);

  return (
    <Fragment>
      <Title headingLevel="h3" size="lg">
        Search results
      </Title>

      <Toolbar>
        <ToolbarContent>
          <ToolbarGroup>
            <ToolbarItem>
              <Label variant="outline">Commit hash</Label>
            </ToolbarItem>
            <ToolbarItem>
              <Label variant="outline">Search by commit hash</Label>
            </ToolbarItem>
          </ToolbarGroup>
          <ToolbarItem variant="pagination">
            <Pagination
              itemCount={rekorEntries.totalCount}
              perPage={PAGE_SIZE}
              page={page}
              onSetPage={onSetPage}
              perPageOptions={[]}
              isCompact
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      <Table aria-label="Rekor search results" variant="compact">
        <Thead>
          <Tr>
            <Th>Commit Hash</Th>
            <Th>Log Index</Th>
            <Th>Entry UUID</Th>
            <Th>Type</Th>
            <Th>Signature</Th>
            <Th>Public Certificate</Th>
            <Th>Integrated time</Th>
            <Th>Action</Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((row) => (
            <Tr key={row.uuid}>
              <Td dataLabel="Commit Hash">
                {row.hash ? (
                  <Link to={{ pathname: Paths.rekorSearch, search: `?hash=${row.hash}` }}>
                    <Truncate content={row.hash.split(":")[1] ?? row.hash} trailingNumChars={0} />
                    {" "}
                    <Icon size="sm" isInline>
                      <ExternalLinkAltIcon />
                    </Icon>
                  </Link>
                ) : (
                  "—"
                )}
              </Td>
              <Td dataLabel="Log Index">{row.logIndex}</Td>
              <Td dataLabel="Entry UUID">
                <Truncate content={row.uuid} trailingNumChars={0} />
              </Td>
              <Td dataLabel="Type">{row.kind}</Td>
              <Td dataLabel="Signature">
                {row.signature ? (
                  <Truncate content={row.signature} trailingNumChars={0} />
                ) : (
                  "—"
                )}
              </Td>
              <Td dataLabel="Public Certificate">
                {row.hasCertificate ? (
                  <Fragment>
                    <Icon status="success" isInline>
                      <CheckCircleIcon />
                    </Icon>{" "}
                    Valid
                  </Fragment>
                ) : (
                  "—"
                )}
              </Td>
              <Td dataLabel="Integrated time">{formatDate(row.integratedTime)}</Td>
              <Td dataLabel="Action" isActionCell>
                <Link to={Paths.rekorEntry.replace(":uuid", row.uuid)}>
                  View details
                </Link>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Fragment>
  );
}
