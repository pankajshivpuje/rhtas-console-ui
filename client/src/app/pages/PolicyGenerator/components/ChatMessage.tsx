import type React from "react";
import { Card, CardBody, Label } from "@patternfly/react-core";
import { CheckCircleIcon, TimesCircleIcon } from "@patternfly/react-icons";
import type { ChatMessage as ChatMessageType } from "../types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "var(--pf-t--global--spacer--sm)",
      }}
    >
      <div
        style={{
          maxWidth: "80%",
          padding:
            "var(--pf-t--global--spacer--sm) var(--pf-t--global--spacer--md)",
          borderRadius: isUser
            ? "var(--pf-t--global--border--radius--large) var(--pf-t--global--border--radius--large) var(--pf-t--global--border--radius--small) var(--pf-t--global--border--radius--large)"
            : "var(--pf-t--global--border--radius--large) var(--pf-t--global--border--radius--large) var(--pf-t--global--border--radius--large) var(--pf-t--global--border--radius--small)",
          boxShadow: "var(--pf-t--global--box-shadow--sm)",
          backgroundColor: isUser
            ? "var(--pf-t--global--color--brand--200)"
            : "var(--pf-t--global--background--color--secondary--default)",
          color: isUser
            ? "var(--pf-t--global--text--color--on-brand--default)"
            : "var(--pf-t--global--text--color--regular)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
        data-testid={`chat-message-${message.id}`}
      >
        {message.content}
        {message.artifacts && (
          <ArtifactSummaryCard artifacts={message.artifacts} />
        )}
      </div>
    </div>
  );
};

const ArtifactSummaryCard: React.FC<{
  artifacts: NonNullable<ChatMessageType["artifacts"]>;
}> = ({ artifacts }) => {
  const testResults = artifacts.testResults;
  const allPassing = testResults && testResults.failed === 0;

  return (
    <Card isCompact style={{ marginTop: "var(--pf-t--global--spacer--sm)" }}>
      <CardBody>
        {testResults && (
          <Label
            color={allPassing ? "green" : "red"}
            icon={allPassing ? <CheckCircleIcon /> : <TimesCircleIcon />}
          >
            {testResults.passed} tests passing
            {testResults.failed > 0 && `, ${testResults.failed} failing`}
          </Label>
        )}
        <div
          style={{
            fontSize: "var(--pf-t--global--font--size--xs)",
            marginTop: "var(--pf-t--global--spacer--xs)",
            color: "var(--pf-t--global--text--color--subtle)",
          }}
        >
          v{artifacts.version} — View artifacts in panel
        </div>
      </CardBody>
    </Card>
  );
};
