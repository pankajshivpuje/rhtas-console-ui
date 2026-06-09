import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type React from "react";

vi.mock("@app/env", () => ({
  default: { MOCK: "on" },
}));

vi.mock("@app/axios-config/apiInit", () => ({
  client: {},
}));

vi.mock("react-syntax-highlighter", () => ({
  Prism: ({ children }: { children: string }) => <pre>{children}</pre>,
}));

vi.mock("react-syntax-highlighter/dist/cjs/styles/prism", () => ({}));

vi.mock("./components/ChatInput", () => {
  const { useState } = require("react");
  return {
    ChatInput: ({ onSend, isDisabled }: any) => {
      const [value, setValue] = useState("");
      return (
        <div>
          <textarea
            placeholder="Describe your policy requirements..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button
            aria-label="Send message"
            onClick={() => {
              if (value.trim()) {
                onSend(value, {});
                setValue("");
              }
            }}
            disabled={isDisabled}
          >
            Send
          </button>
        </div>
      );
    },
  };
});

import { PolicyGenerator } from "./PolicyGenerator";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
};

describe("PolicyGenerator page", () => {
  beforeEach(() => {
    localStorage.clear();
    // Mock scrollIntoView which is not available in jsdom
    Element.prototype.scrollIntoView = vi.fn();
  });

  test("renders page header", () => {
    render(<PolicyGenerator />, { wrapper: createWrapper() });
    expect(screen.getByText("Policy Generator")).toBeInTheDocument();
  });

  test("renders empty state artifacts panel", () => {
    render(<PolicyGenerator />, { wrapper: createWrapper() });
    expect(screen.getByText(/artifacts will appear here/i)).toBeInTheDocument();
  });

  test("renders New Session button", () => {
    render(<PolicyGenerator />, { wrapper: createWrapper() });
    expect(screen.getByText("New Session")).toBeInTheDocument();
  });

  test("renders chat input", () => {
    render(<PolicyGenerator />, { wrapper: createWrapper() });
    expect(
      screen.getByPlaceholderText("Describe your policy requirements..."),
    ).toBeInTheDocument();
  });

  test("sends a message and shows it in chat", async () => {
    render(<PolicyGenerator />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText("Describe your policy requirements...");
    fireEvent.change(input, { target: { value: "Generate a SLSA policy" } });

    const sendButton = screen.getByLabelText("Send message");
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText("Generate a SLSA policy")).toBeInTheDocument();
    });
  });
});
