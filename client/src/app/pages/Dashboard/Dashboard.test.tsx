import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { Dashboard } from "./Dashboard";
import type { PostureSummary, UnsignedArtifact } from "@app/client";

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

vi.mock("@app/components/DocumentMetadata", () => ({
  DocumentMetadata: () => null,
}));

vi.mock("@app/queries/dashboard", () => ({
  useFetchPostureSummary: vi.fn(),
  useFetchUnsignedArtifacts: vi.fn(),
  useFetchPostureTrend: vi.fn(),
  useFetchAttestationCoverage: vi.fn(),
}));


import {
  useFetchPostureSummary,
  useFetchUnsignedArtifacts,
  useFetchPostureTrend,
  useFetchAttestationCoverage,
} from "@app/queries/dashboard";
const mockUseFetchPostureSummary = vi.mocked(useFetchPostureSummary);
const mockUseFetchUnsignedArtifacts = vi.mocked(useFetchUnsignedArtifacts);
const mockUseFetchPostureTrend = vi.mocked(useFetchPostureTrend);
const mockUseFetchAttestationCoverage = vi.mocked(useFetchAttestationCoverage);

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

    mockUseFetchAttestationCoverage.mockReturnValue({
      attestationCoverage: [],
      isFetching: false,
      fetchError: null,
    });

  });

  test("renders Trust Coverage heading", () => {
    renderDashboard();
    expect(screen.getByRole("heading", { name: "Trust Coverage" })).toBeInTheDocument();
  });

  test("loading state shows spinner", () => {
    mockUseFetchPostureSummary.mockReturnValue({
      summary: null,
      isFetching: true,
      fetchError: null,
    });

    renderDashboard();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  test("error state rendered when fetch fails", () => {
    mockUseFetchPostureSummary.mockReturnValue({
      summary: null,
      isFetching: false,
      fetchError: new Error("Network error") as unknown as ReturnType<typeof useFetchPostureSummary>["fetchError"],
    });

    renderDashboard();
    expect(screen.queryByText("Total Artifacts")).not.toBeInTheDocument();
  });

  test("renders summary cards with data", () => {
    mockUseFetchPostureSummary.mockReturnValue({
      summary: fakeSummary,
      isFetching: false,
      fetchError: null,
    });

    renderDashboard();
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

    renderDashboard();
    expect(screen.getByText("quay.io/myorg/billing:1.0")).toBeInTheDocument();
    expect(screen.getByText("registry.example.com/frontend:3.0")).toBeInTheDocument();
  });

  test("empty state when no unsigned artifacts", () => {
    mockUseFetchPostureSummary.mockReturnValue({
      summary: fakeSummary,
      isFetching: false,
      fetchError: null,
    });

    renderDashboard();
    expect(screen.getByText("All artifacts are signed. Great job!")).toBeInTheDocument();
  });

  test("renders repo link", () => {
    renderDashboard();
    const link = screen.getByRole("link", { name: /securesign\/sigstore-ocp/i });
    expect(link).toHaveAttribute("href", "https://github.com/securesign/sigstore-ocp");
    expect(link).toHaveAttribute("target", "_blank");
  });

});
