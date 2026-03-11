import { dump } from "js-yaml";
import { type IntotoV001Schema } from "rekor";
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

export function IntotoViewer001({ intoto }: { intoto: IntotoV001Schema }) {
  const certContent = window.atob(intoto.publicKey || "");

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
                  {`${intoto.content.payloadHash?.algorithm}:${intoto.content.payloadHash?.value}`}
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
                <CodeBlockCode>Missing for intoto v0.0.1 entries</CodeBlockCode>
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
