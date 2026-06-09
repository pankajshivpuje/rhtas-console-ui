import type React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

interface ArtifactCodeViewProps {
  content: string;
  filename: string;
}

const getLanguage = (filename: string): string => {
  if (filename.endsWith(".rego")) return "go";
  if (filename.endsWith(".yaml") || filename.endsWith(".yml")) return "yaml";
  if (filename.endsWith(".json")) return "json";
  return "bash";
};

export const ArtifactCodeView: React.FC<ArtifactCodeViewProps> = ({
  content,
  filename,
}) => {
  return (
    <div style={{ flex: 1, overflow: "auto" }} data-testid="artifact-code-view">
      <SyntaxHighlighter
        language={getLanguage(filename)}
        style={atomDark}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          height: "100%",
          fontSize: "var(--pf-t--global--font--size--sm)",
        }}
        showLineNumbers
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
};
