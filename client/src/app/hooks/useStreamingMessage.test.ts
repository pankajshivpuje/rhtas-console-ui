import { renderHook, act } from "@testing-library/react";
import { describe, expect, test, vi, afterEach } from "vitest";
import { useStreamingMessage } from "./useStreamingMessage";

describe("useStreamingMessage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("returns empty content when content is undefined", () => {
    const { result } = renderHook(() => useStreamingMessage(undefined, false));
    expect(result.current.displayedContent).toBe("");
    expect(result.current.isStreaming).toBe(false);
  });

  test("returns empty content when not active", () => {
    const { result } = renderHook(() => useStreamingMessage("Hello world", false));
    expect(result.current.displayedContent).toBe("");
    expect(result.current.isStreaming).toBe(false);
  });

  test("streams content when active", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useStreamingMessage("Hello", true));

    expect(result.current.isStreaming).toBe(true);
    expect(result.current.displayedContent).toBe("");

    // Advance timers enough to reveal all content
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.displayedContent).toBe("Hello");
    expect(result.current.isStreaming).toBe(false);

    vi.useRealTimers();
  });

  test("cleans up interval on unmount", () => {
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(window, "clearInterval");

    const { unmount } = renderHook(() => useStreamingMessage("Hello", true));
    unmount();

    expect(clearSpy).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
