import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { dump, load } from "js-yaml";
import { Convert } from "pvtsutils";
import {
  type DSSEV001Schema,
  type IntotoV001Schema,
  type IntotoV002Schema,
  type LogEntry,
  type RekorSchema,
  ApiError,
  type RekorError,
} from "rekor";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Bullseye,
  Card,
  CardBody,
  CardTitle,
  CodeBlock,
  CodeBlockCode,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  PageSection,
  Spinner,
  Stack,
  StackItem,
} from "@patternfly/react-core";

import { Paths } from "@app/Routes";
import { DocumentMetadata } from "@app/components/DocumentMetadata";
import { RekorClientProvider, useRekorClient } from "./api/context";
import { toRelativeDateString } from "./utils/date";
import { HashedRekordViewer } from "./components/HashedRekord";
import { IntotoViewer001 } from "./components/Intoto001";
import { IntotoViewer002 } from "./components/Intoto002";
import { DSSEViewer } from "./components/DSSE";

const DUMP_OPTIONS: jsyaml.DumpOptions = {
  replacer: (_key, value: string) => {
    if (Convert.isBase64(value)) {
      try {
        const decodedVal = window.atob(value);
        if (decodedVal.startsWith("-----BEGIN")) {
          return decodedVal;
        }
        return load(decodedVal);
      } catch (_e) {
        return value;
      }
    }
    return value;
  },
};

function tryJSONParse(content?: string): unknown {
  if (!content) {
    return content;
  }
  try {
    return JSON.parse(content);
  } catch (_e) {
    return content;
  }
}

function EntryDetailView({ entry }: { entry: LogEntry }) {
  const [entryUuid, obj] = Object.entries(entry)[0];

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const body = JSON.parse(window.atob(obj.body)) as {
    kind: string;
    apiVersion: string;
    spec: unknown;
  };

  let rawAttestation = obj.attestation?.data as string | undefined;
  for (let i = 0; Convert.isBase64(rawAttestation) && i < 3; i++) {
    rawAttestation = window.atob(rawAttestation);
  }
  const attestation = tryJSONParse(rawAttestation);

  let parsed: ReactNode | undefined;
  switch (body.kind) {
    case "hashedrekord":
      parsed = <HashedRekordViewer hashedRekord={body.spec as RekorSchema} />;
      break;
    case "intoto":
      if (body.apiVersion === "0.0.1") {
        parsed = <IntotoViewer001 intoto={body.spec as IntotoV001Schema} />;
      } else {
        parsed = <IntotoViewer002 intoto={body.spec as IntotoV002Schema} />;
      }
      break;
    case "dsse":
      parsed = <DSSEViewer dsse={body.spec as DSSEV001Schema} />;
      break;
  }

  type PanelId = "body-content" | "verification-content";
  const [expanded, setExpanded] = useState<PanelId[]>([]);

  const toggle = (id: PanelId) => {
    const index = expanded.indexOf(id);
    const newExpanded: PanelId[] =
      index >= 0 ? [...expanded.slice(0, index), ...expanded.slice(index + 1, expanded.length)] : [...expanded, id];
    setExpanded(newExpanded);
  };

  return (
    <>
      <PageSection type="breadcrumb">
        <Breadcrumb>
          <BreadcrumbItem to={Paths.rekorSearch} component={Link as React.FC<{ to: string }>}>
            Log
          </BreadcrumbItem>
          <BreadcrumbItem isActive>#{obj.logIndex}</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>

      <PageSection variant="default">
        <Content>
          <h1>{entryUuid}</h1>
          <p>This page shows transparency log details.</p>
        </Content>
      </PageSection>

      <PageSection>
        <Stack hasGutter>
          <StackItem>
            <Card isPlain>
              <CardTitle>Log details</CardTitle>
              <CardBody>
                <DescriptionList
                  columnModifier={{
                    default: "3Col",
                  }}
                >
                  <DescriptionListGroup>
                    <DescriptionListTerm>Type</DescriptionListTerm>
                    <DescriptionListDescription>{body.kind}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Log Index</DescriptionListTerm>
                    <DescriptionListDescription>{obj.logIndex}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Integrated time</DescriptionListTerm>
                    <DescriptionListDescription>
                      {toRelativeDateString(new Date(obj.integratedTime * 1000))}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </CardBody>
            </Card>
          </StackItem>

          <StackItem>
            <Card isPlain>
              <CardBody>
                <DescriptionList>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Entry UUID</DescriptionListTerm>
                    <DescriptionListDescription>{entryUuid}</DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </CardBody>
            </Card>
          </StackItem>

          <StackItem>
            <Divider />
          </StackItem>

          <StackItem>{parsed}</StackItem>

          <StackItem>
            <Divider />
          </StackItem>

          <StackItem>
            <Card isPlain>
              <CardTitle>Recommended safety guardrails</CardTitle>
              <CardBody>
                <Accordion isBordered>
                  <AccordionItem isExpanded={expanded.includes("body-content")}>
                    <AccordionToggle
                      id="body-header"
                      aria-controls="body-content"
                      onClick={() => toggle("body-content")}
                    >
                      Raw body
                    </AccordionToggle>
                    <AccordionContent>
                      <CodeBlock>
                        <CodeBlockCode>{dump(body, DUMP_OPTIONS)}</CodeBlockCode>
                      </CodeBlock>
                      {!!attestation && (
                        <>
                          <Content component="h4">Attestation</Content>
                          <CodeBlock>
                            <CodeBlockCode>{dump(attestation)}</CodeBlockCode>
                          </CodeBlock>
                        </>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                  {obj.verification && (
                    <AccordionItem isExpanded={expanded.includes("verification-content")}>
                      <AccordionToggle
                        id="verification-header"
                        aria-controls="verification-content"
                        onClick={() => toggle("verification-content")}
                      >
                        Verification
                      </AccordionToggle>
                      <AccordionContent>
                        <CodeBlock>
                          <CodeBlockCode>{dump(obj.verification)}</CodeBlockCode>
                        </CodeBlock>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </CardBody>
            </Card>
          </StackItem>
        </Stack>
      </PageSection>
    </>
  );
}

function EntryDetailContent() {
  const { uuid } = useParams<{ uuid: string }>();
  const client = useRekorClient();
  const [entry, setEntry] = useState<LogEntry>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uuid) return;

    async function fetchEntry() {
      setLoading(true);
      setError(undefined);
      try {
        const result = await client.entries.getLogEntryByUuid({ entryUuid: uuid! });
        setEntry(result);
      } catch (e) {
        if (e instanceof ApiError) {
          const body = e.body as RekorError | undefined;
          setError(body?.message ?? `Error ${e.status}`);
        } else if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("An unknown error occurred");
        }
      }
      setLoading(false);
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchEntry();
  }, [uuid, client]);

  if (loading) {
    return (
      <PageSection>
        <Bullseye>
          <Spinner />
        </Bullseye>
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection>
        <Alert title={error} variant="danger" />
      </PageSection>
    );
  }

  if (!entry) {
    return (
      <PageSection>
        <Alert title="Entry not found" variant="warning" />
      </PageSection>
    );
  }

  return <EntryDetailView entry={entry} />;
}

export const RekorEntryDetail: React.FC = () => {
  return (
    <RekorClientProvider>
      <DocumentMetadata title="Rekor Entry Detail" />
      <EntryDetailContent />
    </RekorClientProvider>
  );
};

export default RekorEntryDetail;
