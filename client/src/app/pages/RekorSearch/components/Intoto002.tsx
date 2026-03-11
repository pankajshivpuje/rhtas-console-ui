import { dump } from "js-yaml";
import { type IntotoV002Schema } from "rekor";
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

export function IntotoViewer002({ intoto }: { intoto: IntotoV002Schema }) {
  const signature = intoto.content.envelope?.signatures[0];
  const certContent = window.atob(signature?.publicKey || "");

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
                <CodeBlockCode>{window.atob(signature?.sig || "")}</CodeBlockCode>
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
