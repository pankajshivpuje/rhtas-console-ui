import { dump } from "js-yaml";
import { type DSSEV001Schema } from "rekor";
import {
  CodeBlock,
  CodeBlockCode,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { decodex509 } from "../x509/decode";

export function DSSEViewer({ dsse }: { dsse: DSSEV001Schema }) {
  const sig = dsse.signatures?.[0];
  const certContent = window.atob(sig?.verifier ?? "");

  const publicKey = {
    title: "Public Key",
    content: certContent,
  };
  if (certContent.includes("BEGIN CERTIFICATE")) {
    publicKey.title = "Public Key Certificate";
    publicKey.content = dump(decodex509(certContent), {
      noArrayIndent: true,
      lineWidth: -1,
    });
  }

  return (
    <Stack hasGutter>
      <StackItem>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>Hash</DescriptionListTerm>
            <DescriptionListDescription>
              <CodeBlock>
                <CodeBlockCode>
                  {`${dsse.payloadHash?.algorithm}:${dsse.payloadHash?.value}`}
                </CodeBlockCode>
              </CodeBlock>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>

      <StackItem>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>Signature</DescriptionListTerm>
            <DescriptionListDescription>
              <CodeBlock>
                <CodeBlockCode>{sig?.signature ?? ""}</CodeBlockCode>
              </CodeBlock>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>

      <StackItem>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{publicKey.title}</DescriptionListTerm>
            <DescriptionListDescription>
              <CodeBlock>
                <CodeBlockCode>{publicKey.content}</CodeBlockCode>
              </CodeBlock>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
    </Stack>
  );
}
