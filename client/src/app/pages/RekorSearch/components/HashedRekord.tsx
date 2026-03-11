import { dump } from "js-yaml";
import { type RekorSchema } from "rekor";
import { decodex509 } from "../x509/decode";
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

export function HashedRekordViewer({ hashedRekord }: { hashedRekord: RekorSchema }) {
  const certContent = window.atob(hashedRekord.signature.publicKey?.content ?? "");

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
                  {`${hashedRekord.data.hash?.algorithm}:${hashedRekord.data.hash?.value}`}
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
                <CodeBlockCode>{hashedRekord.signature.content ?? ""}</CodeBlockCode>
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
