import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { ChatInput } from "./ChatInput";

describe("ChatInput", () => {
  test("calls onSend when send button is clicked", async () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);

    const input = screen.getByPlaceholderText("Ask the agent a question...");
    await userEvent.type(input, "Hello");
    await userEvent.click(screen.getByLabelText("Send message"));

    expect(onSend).toHaveBeenCalledWith("Hello");
  });

  test("calls onSend on Enter key", async () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);

    const input = screen.getByPlaceholderText("Ask the agent a question...");
    await userEvent.type(input, "Hello{enter}");

    expect(onSend).toHaveBeenCalledWith("Hello");
  });

  test("does not send empty messages", async () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);

    await userEvent.click(screen.getByLabelText("Send message"));
    expect(onSend).not.toHaveBeenCalled();
  });

  test("clears input after sending", async () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);

    const input = screen.getByPlaceholderText("Ask the agent a question...");
    await userEvent.type(input, "Hello{enter}");

    expect(input).toHaveValue("");
  });

  test("renders suggested prompts when provided", () => {
    render(<ChatInput onSend={vi.fn()} suggestedPrompts={["What is the status?"]} />);
    expect(screen.getByText("What is the status?")).toBeInTheDocument();
  });

  test("sends suggested prompt on click", async () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} suggestedPrompts={["What is the status?"]} />);

    await userEvent.click(screen.getByText("What is the status?"));
    expect(onSend).toHaveBeenCalledWith("What is the status?");
  });

  test("disables input when disabled prop is true", () => {
    render(<ChatInput onSend={vi.fn()} disabled />);
    expect(screen.getByPlaceholderText("Ask the agent a question...")).toBeDisabled();
  });
});
