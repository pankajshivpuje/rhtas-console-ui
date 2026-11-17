import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getAlerts, getAlertSummary } from "@app/client";
import { AlertBanner } from "@app/components/AlertBanner";
import { MockHealthControls } from "@app/components/MockHealthControls";
import { MockHealthProvider } from "@app/components/MockHealthProvider";
import ENV from "@app/env";
import { useAcknowledgeAlert, useFetchAlerts, useFetchAlertSummary } from "./alerts";
import { getMockAlertList, getMockAlertSummary, getScenarioAlerts } from "./mocks/alerts.mock";

vi.mock("@app/env", () => ({ default: { MOCK: "on" } }));
vi.mock("@app/axios-config/apiInit", () => ({ client: {} }));
vi.mock("@app/client", () => ({ getAlerts: vi.fn(), getAlertSummary: vi.fn(), acknowledgeAlert: vi.fn() }));

const AlertOverview = () => {
  const { alerts } = useFetchAlerts();
  const { alertSummary } = useFetchAlertSummary();
  const { acknowledge } = useAcknowledgeAlert();
  return (
    <>
      <div data-testid="summary">
        {alertSummary &&
          `${alertSummary.critical} critical, ${alertSummary.warning} warning, ${alertSummary.unacknowledged} unacknowledged`}
      </div>
      <div data-testid="alerts">
        {alerts.map((alert) => (
          <div key={alert.id}>
            {alert.summary} — {alert.acknowledged ? "Acknowledged" : "Unacknowledged"}
            {!alert.acknowledged && <button onClick={() => void acknowledge(alert.id)}>Acknowledge {alert.id}</button>}
          </div>
        ))}
      </div>
    </>
  );
};

const renderAlerts = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MockHealthProvider>
        <MemoryRouter>
          <MockHealthControls />
          <AlertBanner />
          <AlertOverview />
        </MemoryRouter>
      </MockHealthProvider>
    </QueryClientProvider>
  );

describe("mock alerts and health scenarios", () => {
  afterEach(cleanup);
  beforeEach(() => {
    ENV.MOCK = "on";
    vi.clearAllMocks();
  });

  it("keeps the banner, alert list and counts consistent as health changes", async () => {
    renderAlerts();
    expect(
      await screen.findByRole("heading", { name: /TAS component fulcio is down/i }, { timeout: 2500 })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /TUF root metadata expired/i })).toBeInTheDocument();
    expect(screen.queryByText(/rekor is down/i)).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("summary")).toHaveTextContent("2 critical, 2 warning"));

    const selector = screen.getByRole("combobox", { name: "System health" });
    fireEvent.change(selector, { target: { value: "degraded" } });
    expect(screen.queryByRole("heading", { name: /is down/i })).not.toBeInTheDocument();
    expect(within(screen.getByTestId("alerts")).getByText(/rekor is degraded/i)).toBeInTheDocument();
    expect(screen.getByTestId("summary")).toHaveTextContent("0 critical, 1 warning");

    fireEvent.change(selector, { target: { value: "healthy" } });
    expect(screen.queryByRole("heading", { name: /is down/i })).not.toBeInTheDocument();
    expect(within(screen.getByTestId("alerts")).queryByText(/rekor is degraded/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("summary")).toHaveTextContent("0 critical, 0 warning");

    fireEvent.change(selector, { target: { value: "down" } });
    expect(screen.getByRole("heading", { name: /TAS component fulcio is down/i })).toBeInTheDocument();
  });

  it("updates mock acknowledgements and counts together", async () => {
    renderAlerts();
    const button = await screen.findByRole("button", { name: "Acknowledge service-fulcio-down" }, { timeout: 2500 });
    await waitFor(() => expect(screen.getByTestId("summary")).toHaveTextContent("5 unacknowledged"));
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByTestId("summary")).toHaveTextContent("4 unacknowledged"));
    expect(within(screen.getByTestId("alerts")).getByText(/fulcio is down — Acknowledged/i)).toBeInTheDocument();
  });

  it("does not filter or rewrite live alerts", async () => {
    ENV.MOCK = "off";
    const liveAlert = {
      ...getScenarioAlerts("down")[0],
      id: "live-rekor",
      summary: "TAS component rekor is down",
    };
    vi.mocked(getAlerts).mockResolvedValue({ data: getMockAlertList([liveAlert]) } as never);
    vi.mocked(getAlertSummary).mockResolvedValue({ data: getMockAlertSummary([liveAlert]) } as never);
    renderAlerts();
    expect(await screen.findByRole("heading", { name: /TAS component rekor is down/i })).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "System health" })).not.toBeInTheDocument();
  });
});
