import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { Agent } from "./Agent";
import type { AgentInsight } from "@app/client";

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

vi.mock("@app/components/DocumentMetadata", () => ({
  DocumentMetadata: () => null,
}));

vi.mock("@app/queries/agent", () => ({
  useFetchInsights: vi.fn(),
  useSendChatMessage: vi.fn(),
}));

vi.mock("@app/hooks/useStreamingMessage", () => ({
  useStreamingMessage: vi.fn(),
}));

import { useFetchInsights, useSendChatMessage } from "@app/queries/agent";
import { useStreamingMessage } from "@app/hooks/useStreamingMessage";
const mockUseFetchInsights = vi.mocked(useFetchInsights);
const mockUseSendChatMessage = vi.mocked(useSendChatMessage);
const mockUseStreamingMessage = vi.mocked(useStreamingMessage);

const fakeInsights: AgentInsight[] = [
  {
    id: "insight-1",
    severity: "critical",
    title: "TUF root expires soon",
    description: "Root metadata approaching expiration.",
    domain: "trust-root",
    timestamp: "2026-07-14T10:00:00Z",
    suggestedPrompt: "Tell me about the TUF root",
  },
];

describe("Agent page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFetchInsights.mockReturnValue({
      insights: [],
      isFetching: false,
      fetchError: null,
    });
    mockUseSendChatMessage.mockReturnValue({
      sendMessage: vi.fn(),
      data: undefined,
      isPending: false,
      error: null,
    });
    mockUseStreamingMessage.mockReturnValue({
      displayedContent: "",
      isStreaming: false,
    });
  });

  test("renders Ask agent heading", () => {
    render(
      <MemoryRouter>
        <Agent />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: "Ask agent" })).toBeInTheDocument();
  });

  test("shows empty state when no insights", () => {
    render(
      <MemoryRouter>
        <Agent />
      </MemoryRouter>
    );
    expect(screen.getByText("Your signing infrastructure looks healthy.")).toBeInTheDocument();
  });

  test("renders insight cards when data is available", () => {
    mockUseFetchInsights.mockReturnValue({
      insights: fakeInsights,
      isFetching: false,
      fetchError: null,
    });

    render(
      <MemoryRouter>
        <Agent />
      </MemoryRouter>
    );
    expect(screen.getByText("TUF root expires soon")).toBeInTheDocument();
    expect(screen.getByText("1 Critical")).toBeInTheDocument();
  });

  test("renders chat panel with suggested prompts", () => {
    render(
      <MemoryRouter>
        <Agent />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText("Ask the agent a question...")).toBeInTheDocument();
  });

  test("loading state shows spinner", () => {
    mockUseFetchInsights.mockReturnValue({
      insights: [],
      isFetching: true,
      fetchError: null,
    });

    render(
      <MemoryRouter>
        <Agent />
      </MemoryRouter>
    );
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});
