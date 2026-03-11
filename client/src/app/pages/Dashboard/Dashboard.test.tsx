import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { Dashboard } from "./Dashboard";
import type { PostureSummary, UnsignedArtifact } from "@app/client";

vi.mock("@app/components/DocumentMetadata", () => ({
  DocumentMetadata: () => null,
}));

vi.mock("@app/queries/dashboard", () => ({
  useFetchPostureSummary: vi.fn(),
  useFetchUnsignedArtifacts: vi.fn(),
  useFetchPostureTrend: vi.fn(),
}));

import { useFetchPostureSummary, useFetchUnsignedArtifacts, useFetchPostureTrend } from "@app/queries/dashboard";

const mockUseFetchPostureSummary = vi.mocked(useFetchPostureSummary);
const mockUseFetchUnsignedArtifacts = vi.mocked(useFetchUnsignedArtifacts);
const mockUseFetchPostureTrend = vi.mocked(useFetchPostureTrend);

const fakeSummary: PostureSummary = {
  totalArtifacts: 100,
  signedCount: 87,
  unsignedCount: 3,
  partiallySignedCount: 10,
  signedPercentage: 87,
  attestationCoverage: 92,
};

const fakeUnsignedArtifacts: UnsignedArtifact[] = [
  {
    uri: "quay.io/myorg/billing:1.0",
    environment: "production",
    lastSeen: "2026-03-09T14:00:00Z",
    registry: "quay.io",
  },
  {
    uri: "registry.example.com/frontend:3.0",
    environment: "staging",
    lastSeen: "2026-03-08T10:00:00Z",
    registry: "registry.example.com",
  },
];

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseFetchPostureSummary.mockReturnValue({
      summary: null,
      isFetching: false,
      fetchError: null,
    });

    mockUseFetchUnsignedArtifacts.mockReturnValue({
      unsignedArtifacts: [],
      isFetching: false,
      fetchError: null,
    });

    mockUseFetchPostureTrend.mockReturnValue({
      trend: [],
      isFetching: false,
      fetchError: null,
    });
  });

  test("renders heading", () => {
    render(<Dashboard />);
    expect(screen.getByRole("heading", { name: "Trust Coverage" })).toBeInTheDocument();
  });

  test("loading state shows spinner", () => {
    mockUseFetchPostureSummary.mockReturnValue({
      summary: null,
      isFetching: true,
      fetchError: null,
    });

    render(<Dashboard />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  test("error state rendered when fetch fails", () => {
    mockUseFetchPostureSummary.mockReturnValue({
      summary: null,
      isFetching: false,
      fetchError: new Error("Network error") as unknown as ReturnType<typeof useFetchPostureSummary>["fetchError"],
    });

    render(<Dashboard />);
    // LoadingWrapper renders ErrorEmptyState on error
    expect(screen.queryByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Total Artifacts")).not.toBeInTheDocument();
  });

  test("renders summary cards with data", () => {
    mockUseFetchPostureSummary.mockReturnValue({
      summary: fakeSummary,
      isFetching: false,
      fetchError: null,
    });

    render(<Dashboard />);
    expect(screen.getByText("Total Artifacts")).toBeInTheDocument();
    expect(screen.getByText("Unsigned in Production")).toBeInTheDocument();
    expect(screen.getByText("87%")).toBeInTheDocument();
    expect(screen.getByText("92%")).toBeInTheDocument();
    expect(screen.getByText("Action needed")).toBeInTheDocument();
  });

  test("renders unsigned artifacts table", () => {
    mockUseFetchPostureSummary.mockReturnValue({
      summary: fakeSummary,
      isFetching: false,
      fetchError: null,
    });
    mockUseFetchUnsignedArtifacts.mockReturnValue({
      unsignedArtifacts: fakeUnsignedArtifacts,
      isFetching: false,
      fetchError: null,
    });

    render(<Dashboard />);
    expect(screen.getByText("quay.io/myorg/billing:1.0")).toBeInTheDocument();
    expect(screen.getByText("registry.example.com/frontend:3.0")).toBeInTheDocument();
  });

  test("empty state when no unsigned artifacts", () => {
    mockUseFetchPostureSummary.mockReturnValue({
      summary: fakeSummary,
      isFetching: false,
      fetchError: null,
    });

    render(<Dashboard />);
    expect(screen.getByText("All artifacts are signed. Great job!")).toBeInTheDocument();
  });

  test("environment filter filters unsigned artifacts", async () => {
    const user = userEvent.setup();

    mockUseFetchPostureSummary.mockReturnValue({
      summary: fakeSummary,
      isFetching: false,
      fetchError: null,
    });
    mockUseFetchUnsignedArtifacts.mockReturnValue({
      unsignedArtifacts: fakeUnsignedArtifacts,
      isFetching: false,
      fetchError: null,
    });

    render(<Dashboard />);

    // Both artifacts visible initially (All filter)
    expect(screen.getByText("quay.io/myorg/billing:1.0")).toBeInTheDocument();
    expect(screen.getByText("registry.example.com/frontend:3.0")).toBeInTheDocument();

    // Click Production filter
    await user.click(screen.getByText("Production"));

    expect(screen.getByText("quay.io/myorg/billing:1.0")).toBeInTheDocument();
    expect(screen.queryByText("registry.example.com/frontend:3.0")).not.toBeInTheDocument();
  });
});
