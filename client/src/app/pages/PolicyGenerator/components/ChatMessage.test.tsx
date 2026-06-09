import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatMessage } from "./ChatMessage";
import type { ChatMessage as ChatMessageType } from "../types";

describe("ChatMessage", () => {
  const userMessage: ChatMessageType = {
    id: "msg-1",
    role: "user",
    content: "Generate a SLSA policy",
    timestamp: "2026-06-08T10:00:00Z",
  };

  const assistantMessage: ChatMessageType = {
    id: "msg-2",
    role: "assistant",
    content: "I've generated a SLSA provenance policy with 3 rules.",
    timestamp: "2026-06-08T10:01:00Z",
  };

  const assistantWithArtifacts: ChatMessageType = {
    id: "msg-3",
    role: "assistant",
    content: "Here is your policy.",
    artifacts: {
      rule: { filename: "policy.rego", content: "package test" },
      tests: { filename: "policy_test.rego", content: "package test_test" },
      config: { filename: "policy.yaml", content: "sources: []" },
      command: "ec validate image",
      version: 1,
      testResults: { passed: 2, failed: 0, results: [] },
    },
    timestamp: "2026-06-08T10:02:00Z",
  };

  test("renders user message content", () => {
    render(<ChatMessage message={userMessage} />);
    expect(screen.getByText("Generate a SLSA policy")).toBeInTheDocument();
  });

  test("renders assistant message content", () => {
    render(<ChatMessage message={assistantMessage} />);
    expect(screen.getByText(/I've generated a SLSA provenance policy/)).toBeInTheDocument();
  });

  test("shows artifact summary card when artifacts are present", () => {
    render(<ChatMessage message={assistantWithArtifacts} />);
    expect(screen.getByText(/2 tests passing/i)).toBeInTheDocument();
  });

  test("does not show artifact card for messages without artifacts", () => {
    render(<ChatMessage message={assistantMessage} />);
    expect(screen.queryByText(/tests passing/i)).not.toBeInTheDocument();
  });
});
