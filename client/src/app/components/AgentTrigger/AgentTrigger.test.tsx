import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { AgentTrigger } from "./AgentTrigger";

vi.mock("@app/queries/agent", () => ({
  useFetchInsightSummary: vi.fn(),
  useFetchInsights: vi.fn(),
}));

import { useFetchInsightSummary, useFetchInsights } from "@app/queries/agent";
const mockUseFetchInsightSummary = vi.mocked(useFetchInsightSummary);
const mockUseFetchInsights = vi.mocked(useFetchInsights);

describe("AgentTrigger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFetchInsightSummary.mockReturnValue({
      summary: { criticalCount: 2, warningCount: 3, infoCount: 1, totalCount: 6 },
      isFetching: false,
      fetchError: null,
    });
    mockUseFetchInsights.mockReturnValue({
      insights: [],
      isFetching: false,
      fetchError: null,
    });
  });

  test("renders agent button", () => {
    render(<MemoryRouter><AgentTrigger /></MemoryRouter>);
    expect(screen.getByLabelText("Agent insights")).toBeInTheDocument();
  });

  test("shows badge with total count", () => {
    render(<MemoryRouter><AgentTrigger /></MemoryRouter>);
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  test("hides badge when count is 0", () => {
    mockUseFetchInsightSummary.mockReturnValue({
      summary: { criticalCount: 0, warningCount: 0, infoCount: 0, totalCount: 0 },
      isFetching: false,
      fetchError: null,
    });

    render(<MemoryRouter><AgentTrigger /></MemoryRouter>);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});
