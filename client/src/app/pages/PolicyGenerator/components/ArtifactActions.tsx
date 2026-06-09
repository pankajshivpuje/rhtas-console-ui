import type React from "react";
import { useState } from "react";
import { Button, Split, SplitItem, Tooltip } from "@patternfly/react-core";
import { DownloadIcon, CopyIcon, CheckIcon } from "@patternfly/react-icons";
import type { PolicyArtifacts } from "../types";

interface ArtifactActionsProps {
  artifacts: PolicyArtifacts;
  activeTabContent: string;
}

const downloadAsZip = async (artifacts: PolicyArtifacts): Promise<void> => {
  const files: Array<{ name: string; content: string }> = [
    { name: artifacts.rule.filename, content: artifacts.rule.content },
    { name: artifacts.tests.filename, content: artifacts.tests.content },
    { name: artifacts.config.filename, content: artifacts.config.content },
  ];

  if (artifacts.data) {
    files.push({ name: artifacts.data.filename, content: artifacts.data.content });
  }

  files.push({ name: "validate.sh", content: `#!/bin/bash\n${artifacts.command}\n` });

  for (const file of files) {
    const blob = new Blob([file.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = file.name;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
};

export const ArtifactActions: React.FC<ArtifactActionsProps> = ({
  artifacts,
  activeTabContent,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(activeTabContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        padding: "var(--pf-t--global--spacer--sm) var(--pf-t--global--spacer--md)",
      }}
    >
      <Split hasGutter>
        <SplitItem isFilled>
          <Button
            variant="primary"
            icon={<DownloadIcon />}
            onClick={() => downloadAsZip(artifacts)}
          >
            Download All Files
          </Button>
        </SplitItem>
        <SplitItem>
          <Tooltip content={copied ? "Copied!" : "Copy to clipboard"}>
            <Button
              variant="secondary"
              icon={copied ? <CheckIcon /> : <CopyIcon />}
              onClick={handleCopy}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </Tooltip>
        </SplitItem>
      </Split>
    </div>
  );
};
