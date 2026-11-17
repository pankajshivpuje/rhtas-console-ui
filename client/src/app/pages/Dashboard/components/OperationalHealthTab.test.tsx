import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ENV from "@app/env";
import { MockHealthControls } from "@app/components/MockHealthControls";
import { MockHealthProvider } from "@app/components/MockHealthProvider";
import { useFetchExpiringAssets, useFetchServiceHealth } from "@app/queries/health";
import { serviceHealthMock } from "@app/queries/mocks/health.mock";
import { OperationalHealthTab } from "./OperationalHealthTab";

vi.mock("@app/env", () => ({ default: { MOCK: "on" } }));
vi.mock("@app/queries/health", () => ({
  HealthKeys: { all: ["Health"] },
  useFetchServiceHealth: vi.fn(),
  useFetchExpiringAssets: vi.fn(),
  useFetchErrorRate: () => ({ errorRate: null, isFetching: false, fetchError: null }),
  useFetchIncidents: () => ({ incidents: [], isFetching: false, fetchError: null }),
}));

const mockHealth = vi.mocked(useFetchServiceHealth);

const renderTab = () => {
  const client = new QueryClient();
  const refetch = vi.spyOn(client, "refetchQueries");
  render(
    <QueryClientProvider client={client}>
      <MockHealthProvider>
        <MockHealthControls />
        <OperationalHealthTab />
      </MockHealthProvider>
    </QueryClientProvider>
  );
  return { refetch };
};

describe("Operational health summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ENV.MOCK = "on";
    mockHealth.mockReturnValue({
      serviceHealth: serviceHealthMock,
      isFetching: false,
      isRefreshing: false,
      dataUpdatedAt: 1_700_000_000_000,
      fetchError: null,
    });
    vi.mocked(useFetchExpiringAssets).mockReturnValue({ expiringAssets: [], isFetching: false, fetchError: null });
  });

  it("shows the worst service status and removes Cosign", () => {
    renderTab();
    expect(screen.getByText("Overall health: Down")).toBeInTheDocument();
    expect(screen.getByText("Fulcio, TUF down; Rekor degraded.")).toBeInTheDocument();
    expect(screen.queryByText("Cosign")).not.toBeInTheDocument();
    expect(screen.getByText("Fulcio")).toBeInTheDocument();
    expect(screen.getByText("Rekor")).toBeInTheDocument();
    expect(screen.getByText("TUF")).toBeInTheDocument();
  });

  it("switches between down, degraded and healthy mock scenarios", () => {
    renderTab();
    const select = screen.getByRole("combobox", { name: "System health" });
    expect(select).toHaveValue("down");
    fireEvent.change(select, { target: { value: "degraded" } });
    expect(screen.getByText("Overall health: Degraded")).toBeInTheDocument();
    expect(screen.getByText("Rekor degraded.")).toBeInTheDocument();
    expect(screen.getByText("Rekor latency exceeded threshold")).toBeInTheDocument();
    expect(screen.queryByText("TUF root metadata expired")).not.toBeInTheDocument();
    fireEvent.change(select, { target: { value: "healthy" } });
    expect(screen.getByText("Overall health: Healthy")).toBeInTheDocument();
    expect(screen.getByText("All monitored services are healthy.")).toBeInTheDocument();
    expect(screen.queryByText("Cosign")).not.toBeInTheDocument();
    fireEvent.change(select, { target: { value: "down" } });
    expect(screen.getByText("Overall health: Down")).toBeInTheDocument();
  });

  it("shows checking or unavailable instead of a healthy status without data", () => {
    mockHealth.mockReturnValue({
      serviceHealth: undefined,
      isFetching: true,
      isRefreshing: true,
      dataUpdatedAt: 0,
      fetchError: null,
    });
    const { rerender } = render(
      <QueryClientProvider client={new QueryClient()}>
        <OperationalHealthTab />
      </QueryClientProvider>
    );
    expect(screen.getByText("Overall health: Checking")).toBeInTheDocument();
    mockHealth.mockReturnValue({
      serviceHealth: undefined,
      isFetching: false,
      isRefreshing: false,
      dataUpdatedAt: 0,
      fetchError: new Error("Unavailable") as ReturnType<typeof useFetchServiceHealth>["fetchError"],
    });
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <OperationalHealthTab />
      </QueryClientProvider>
    );
    expect(screen.getByText("Overall health: Unavailable")).toBeInTheDocument();
  });

  it("hides the mock controls in live mode and refreshes health queries", () => {
    ENV.MOCK = "off";
    const { refetch } = renderTab();
    expect(screen.queryByRole("combobox", { name: "System health" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(refetch).toHaveBeenCalledWith({ queryKey: ["Health"] });
  });

  it("keeps the summary visible if another health panel fails", () => {
    vi.mocked(useFetchExpiringAssets).mockReturnValue({
      expiringAssets: [],
      isFetching: false,
      fetchError: new Error("Unavailable") as ReturnType<typeof useFetchExpiringAssets>["fetchError"],
    });
    renderTab();
    expect(screen.getByText("Overall health: Down")).toBeInTheDocument();
    expect(screen.getByText("Unable to connect")).toBeInTheDocument();
  });
});
