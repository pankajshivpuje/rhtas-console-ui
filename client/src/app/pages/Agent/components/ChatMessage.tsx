import React from "react";
import { Flex, FlexItem, Icon } from "@patternfly/react-core";
import OutlinedRobotIcon from "@patternfly/react-icons/dist/esm/icons/robot-icon";
import UserIcon from "@patternfly/react-icons/dist/esm/icons/user-icon";

import type { ChatMessage as ChatMessageType } from "@app/client";

import { AgentResponseContent } from "./AgentResponseContent";

interface ChatMessageProps {
  message: ChatMessageType;
  displayContent?: string;
  isStreaming?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  displayContent,
  isStreaming = false,
}) => {
  const isAgent = message.role === "agent";
  const content = displayContent ?? message.content;

  return (
    <Flex
      justifyContent={{ default: isAgent ? "justifyContentFlexStart" : "justifyContentFlexEnd" }}
      style={{ marginBottom: "var(--pf-t--global--spacer--md)" }}
    >
      {isAgent && (
        <FlexItem>
          <Icon size="lg">
            <OutlinedRobotIcon />
          </Icon>
        </FlexItem>
      )}
      <FlexItem
        style={{
          maxWidth: "75%",
          padding: "var(--pf-t--global--spacer--sm) var(--pf-t--global--spacer--md)",
          borderRadius: "var(--pf-t--global--border--radius--medium)",
          backgroundColor: isAgent
            ? "var(--pf-t--global--background--color--secondary--default)"
            : "var(--pf-t--global--color--brand--default)",
          color: isAgent ? undefined : "var(--pf-t--global--text--color--on-brand--default)",
        }}
      >
        {isAgent ? (
          <AgentResponseContent content={content} />
        ) : (
          <p>{content}</p>
        )}
        {isStreaming && <span className="pf-v6-c-spinner pf-m-sm" role="progressbar" />}
        <div style={{ fontSize: "var(--pf-t--global--font--size--xs)", opacity: 0.7, marginTop: "var(--pf-t--global--spacer--xs)" }}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </FlexItem>
      {!isAgent && (
        <FlexItem>
          <Icon size="lg">
            <UserIcon />
          </Icon>
        </FlexItem>
      )}
    </Flex>
  );
};
