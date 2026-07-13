import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { Dashboard } from "./Dashboard";
import type { PostureSummary, SignedArtifact } from "@app/client";

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
  useFetchSignedArtifacts: vi.fn(),
  useFetchPostureTrend: vi.fn(),
  useFetchAttestationCoverage: vi.fn(),
}));

import {
  useFetchPostureSummary,
  useFetchSignedArtifacts,
  useFetchPostureTrend,
  useFetchAttestationCoverage,
} from "@app/queries/dashboard";
const mockUseFetchPostureSummary = vi.mocked(useFetchPostureSummary);
const mockUseFetchSignedArtifacts = vi.mocked(useFetchSignedArtifacts);
const mockUseFetchPostureTrend = vi.mocked(useFetchPostureTrend);
const mockUseFetchAttestationCoverage = vi.mocked(useFetchAttestationCoverage);

const fakeSummary: PostureSummary = {
  signedCount: 87,
  signedWithAttestationCount: 72,
  attestationCoverage: 92,
};

const fakeSignedArtifacts: SignedArtifact[] = [
  {
    uri: "quay.io/myorg/billing:1.0",
    environment: "production",
    lastSeen: "2026-03-09T14:00:00Z",
    registry: "quay.io",
    hasAttestation: true,
    attestationTypes: ["SLSA Provenance"],
  },
  {
    uri: "registry.example.com/frontend:3.0",
    environment: "staging",
    lastSeen: "2026-03-08T10:00:00Z",
    registry: "registry.example.com",
    hasAttestation: false,
    attestationTypes: [],
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

    mockUseFetchSignedArtifacts.mockReturnValue({
      signedArtifacts: [],
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
    expect(screen.queryByText("Signed Artifacts")).not.toBeInTheDocument();
  });

  test("renders summary cards with data", () => {
    mockUseFetchPostureSummary.mockReturnValue({
      summary: fakeSummary,
      isFetching: false,
      fetchError: null,
    });

    renderDashboard();
    expect(screen.getAllByText("Signed Artifacts").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("With Attestations").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("92%")).toBeInTheDocument();
  });

  test("renders signed artifacts table", () => {
    mockUseFetchPostureSummary.mockReturnValue({
      summary: fakeSummary,
      isFetching: false,
      fetchError: null,
    });
    mockUseFetchSignedArtifacts.mockReturnValue({
      signedArtifacts: fakeSignedArtifacts,
      isFetching: false,
      fetchError: null,
    });

    renderDashboard();
    expect(screen.getByText("quay.io/myorg/billing:1.0")).toBeInTheDocument();
    expect(screen.getByText("registry.example.com/frontend:3.0")).toBeInTheDocument();
  });

  test("empty state when no signed artifacts", () => {
    mockUseFetchPostureSummary.mockReturnValue({
      summary: fakeSummary,
      isFetching: false,
      fetchError: null,
    });

    renderDashboard();
    expect(screen.getByText("No signed artifacts found.")).toBeInTheDocument();
  });

  test("renders repo link", () => {
    renderDashboard();
    const link = screen.getByRole("link", { name: /securesign\/sigstore-ocp/i });
    expect(link).toHaveAttribute("href", "https://github.com/securesign/sigstore-ocp");
    expect(link).toHaveAttribute("target", "_blank");
  });
});
