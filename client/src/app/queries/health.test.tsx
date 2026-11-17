import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getApiV1RekorPublicKey, getApiV1TrustConfig, getApiV1TrustRootMetadataInfo } from "@app/client";
import { useFetchServiceHealth } from "./health";
import { getOverallHealth } from "./healthSummary";

vi.mock("@app/env", () => ({ default: { MOCK: "off" } }));
vi.mock("@app/axios-config/apiInit", () => ({ client: {} }));
vi.mock("@app/client", () => ({
  getApiV1TrustConfig: vi.fn(),
  getApiV1TrustRootMetadataInfo: vi.fn(),
  getApiV1RekorPublicKey: vi.fn(),
}));

const renderHealth = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderHook(() => useFetchServiceHealth(), {
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
};

describe("service health", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    for (const probe of [getApiV1TrustConfig, getApiV1TrustRootMetadataInfo, getApiV1RekorPublicKey]) {
      vi.mocked(probe).mockResolvedValue({} as never);
    }
  });

  it("maps live checks to the three monitored services and uses the worst status", async () => {
    vi.mocked(getApiV1RekorPublicKey).mockRejectedValue(new Error("Rekor unavailable"));
    const { result } = renderHealth();
    await waitFor(() => expect(result.current.serviceHealth).toBeDefined());
    expect(result.current.serviceHealth?.services.map(({ name, status }) => [name, status])).toEqual([
      ["Fulcio", "healthy"],
      ["Rekor", "down"],
      ["TUF", "healthy"],
    ]);
    expect(getOverallHealth(result.current.serviceHealth?.services)).toBe("down");
  });

  it("reports unavailable when no service check returns data", async () => {
    for (const probe of [getApiV1TrustConfig, getApiV1TrustRootMetadataInfo, getApiV1RekorPublicKey]) {
      vi.mocked(probe).mockRejectedValue(new Error("Check unavailable"));
    }
    const { result } = renderHealth();
    await waitFor(() => expect(result.current.fetchError).not.toBeNull());
    expect(result.current.serviceHealth).toBeUndefined();
    expect(getOverallHealth(result.current.serviceHealth?.services)).toBe("unavailable");
  });

  it("does not treat an empty set of services as healthy", () => {
    expect(getOverallHealth([])).toBe("unavailable");
  });
});
