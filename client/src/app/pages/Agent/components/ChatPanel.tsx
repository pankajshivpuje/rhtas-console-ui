import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, CardBody, CardHeader, CardTitle, Alert } from "@patternfly/react-core";
import PlusCircleIcon from "@patternfly/react-icons/dist/esm/icons/plus-circle-icon";

import type { ChatMessage as ChatMessageType } from "@app/client";
import { useStreamingMessage } from "@app/hooks/useStreamingMessage";
import { useSendChatMessage } from "@app/queries/agent";

import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";

const STORAGE_KEY = "rhtas-agent-conversation";

const defaultSuggestedPrompts = [
  "What is the overall health of my signing infrastructure?",
  "Which production artifacts are missing attestations?",
  "When does the TUF root expire?",
  "Summarize the unacknowledged critical alerts",
];

interface ChatPanelProps {
  initialPrompt?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ initialPrompt }) => {
  const [messages, setMessages] = useState<ChatMessageType[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as ChatMessageType[]) : [];
    } catch {
      return [];
    }
  });

  const { sendMessage, data: agentResponse, isPending, error: sendError } = useSendChatMessage();
  const { displayedContent, isStreaming } = useStreamingMessage(agentResponse?.content, !!agentResponse);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSentPrompt = useRef<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // localStorage full or unavailable
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, displayedContent]);

  useEffect(() => {
    if (agentResponse && !isStreaming && agentResponse.status === "complete") {
      setMessages((prev) => {
        if (prev.some((m) => m.id === agentResponse.id)) return prev;
        return [...prev, agentResponse];
      });
    }
  }, [agentResponse, isStreaming]);

  const handleSend = useCallback(
    (text: string) => {
      const userMessage: ChatMessageType = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
        status: "complete",
      };
      setMessages((prev) => [...prev, userMessage]);
      sendMessage({ message: text });
    },
    [sendMessage]
  );

  useEffect(() => {
    if (initialPrompt && initialPrompt !== lastSentPrompt.current) {
      lastSentPrompt.current = initialPrompt;
      handleSend(initialPrompt);
    }
  }, [initialPrompt, handleSend]);

  const handleNewConversation = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <Card isFullHeight style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <CardHeader
        actions={{
          actions: (
            <Button variant="link" icon={<PlusCircleIcon />} onClick={handleNewConversation}>
              New conversation
            </Button>
          ),
          hasNoOffset: true,
        }}
      >
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <CardBody style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            marginBottom: "var(--pf-t--global--spacer--md)",
          }}
        >
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {agentResponse && isStreaming && !messages.some((m) => m.id === agentResponse.id) && (
            <ChatMessage message={agentResponse} displayContent={displayedContent} isStreaming />
          )}
          <div ref={messagesEndRef} />
        </div>

        {sendError && (
          <Alert
            variant="danger"
            isInline
            isPlain
            title="Failed to send message. Please try again."
            style={{ marginBottom: "var(--pf-t--global--spacer--sm)" }}
          />
        )}

        <ChatInput
          onSend={handleSend}
          disabled={isPending}
          suggestedPrompts={messages.length === 0 ? defaultSuggestedPrompts : undefined}
        />
      </CardBody>
    </Card>
  );
};
