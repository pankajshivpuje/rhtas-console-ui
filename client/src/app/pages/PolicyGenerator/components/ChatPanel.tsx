import type React from "react";
import { useEffect, useRef } from "react";
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  Spinner,
} from "@patternfly/react-core";
import type { ChatMessage as ChatMessageType, PolicyType, VerificationContext } from "../types";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

interface ChatPanelProps {
  messages: ChatMessageType[];
  isGenerating: boolean;
  policyTypeFilter: PolicyType;
  onPolicyTypeChange: (type: PolicyType) => void;
  onSendMessage: (
    message: string,
    options: {
      imageRef?: string;
      verification?: VerificationContext;
    },
  ) => void;
  error?: string | null;
  onRetry?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isGenerating,
  policyTypeFilter,
  onPolicyTypeChange,
  onSendMessage,
  error,
  onRetry,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isGenerating]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minWidth: 0,
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "var(--pf-t--global--spacer--md)",
        }}
      >
        {messages.length === 0 && !isGenerating && (
          <Bullseye>
            <EmptyState>
              <EmptyStateBody>
                Describe your supply chain security requirements and I'll generate
                a Conforma policy. Supports SBOM composition and SLSA build
                provenance.
              </EmptyStateBody>
            </EmptyState>
          </Bullseye>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isGenerating && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              marginBottom: "var(--pf-t--global--spacer--sm)",
            }}
          >
            <div
              style={{
                padding: "var(--pf-t--global--spacer--sm) var(--pf-t--global--spacer--md)",
                borderRadius: "var(--pf-t--global--border--radius--medium)",
                backgroundColor: "var(--pf-t--global--background--color--secondary--default)",
              }}
            >
              <Spinner size="md" aria-label="Generating policy" />{" "}
              Generating...
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              marginBottom: "var(--pf-t--global--spacer--sm)",
            }}
          >
            <div
              style={{
                padding: "var(--pf-t--global--spacer--sm) var(--pf-t--global--spacer--md)",
                borderRadius: "var(--pf-t--global--border--radius--medium)",
                backgroundColor: "var(--pf-t--global--color--red--100)",
                color: "var(--pf-t--global--color--red--300)",
              }}
            >
              {error}
              {onRetry && (
                <button
                  onClick={onRetry}
                  style={{
                    marginLeft: "var(--pf-t--global--spacer--sm)",
                    textDecoration: "underline",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    color: "inherit",
                  }}
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSend={onSendMessage}
        isDisabled={isGenerating}
        policyTypeFilter={policyTypeFilter}
        onPolicyTypeChange={onPolicyTypeChange}
      />
    </div>
  );
};
