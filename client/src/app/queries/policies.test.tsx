import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import type React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@app/env", () => ({
  default: { MOCK: "on" },
}));

vi.mock("@app/axios-config/apiInit", () => ({
  client: {},
}));

import { usePolicyGenerate, usePolicyValidate } from "./policies";

describe("Policy Mutations", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe("usePolicyGenerate", () => {
    test("returns mock response in MOCK=on mode", async () => {
      const { result } = renderHook(() => usePolicyGenerate(), { wrapper });

      await act(async () => {
        result.current.generate({
          sessionId: "test-session",
          message: "Generate a SLSA policy",
          history: [],
        });
      });

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });
    });
  });

  describe("usePolicyValidate", () => {
    test("returns mock validation response in MOCK=on mode", async () => {
      const { result } = renderHook(() => usePolicyValidate(), { wrapper });

      await act(async () => {
        result.current.validate({
          rule: "package test",
          tests: "package test_test",
        });
      });

      await waitFor(() => {
        expect(result.current.isValidating).toBe(false);
      });
    });
  });
});
