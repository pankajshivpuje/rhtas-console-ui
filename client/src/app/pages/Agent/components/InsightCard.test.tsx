import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import type { AgentInsight } from "@app/client";
import { InsightCard } from "./InsightCard";

const mockInsight: AgentInsight = {
  id: "test-1",
  severity: "critical",
  title: "TUF root expires soon",
  description: "The root metadata is approaching expiration.",
  domain: "trust-root",
  timestamp: "2026-07-14T10:00:00Z",
  suggestedPrompt: "Tell me about the TUF root",
};

describe("InsightCard", () => {
  test("renders title and description", () => {
    render(<InsightCard insight={mockInsight} onClick={vi.fn()} />);
    expect(screen.getByText("TUF root expires soon")).toBeInTheDocument();
    expect(screen.getByText("The root metadata is approaching expiration.")).toBeInTheDocument();
  });

  test("renders severity label", () => {
    render(<InsightCard insight={mockInsight} onClick={vi.fn()} />);
    expect(screen.getByText("Critical")).toBeInTheDocument();
  });

  test("renders domain label", () => {
    render(<InsightCard insight={mockInsight} onClick={vi.fn()} />);
    expect(screen.getByText("Trust Root")).toBeInTheDocument();
  });

  test("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<InsightCard insight={mockInsight} onClick={onClick} />);

    await userEvent.click(screen.getByText("TUF root expires soon"));
    expect(onClick).toHaveBeenCalledWith(mockInsight);
  });
});
