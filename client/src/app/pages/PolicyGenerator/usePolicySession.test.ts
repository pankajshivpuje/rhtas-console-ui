import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@app/env", () => ({
  default: { MOCK: "on" },
}));

import { usePolicySession, STORAGE_KEY } from "./usePolicySession";

describe("usePolicySession", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test("creates a new session on first render", () => {
    const { result } = renderHook(() => usePolicySession());

    expect(result.current.session).toBeDefined();
    expect(result.current.session.id).toBeTruthy();
    expect(result.current.session.messages).toHaveLength(0);
    expect(result.current.session.currentArtifacts).toBeNull();
  });

  test("persists session to localStorage", () => {
    const { result } = renderHook(() => usePolicySession());

    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe(result.current.session.id);
  });

  test("appendMessage adds a message to the session", () => {
    const { result } = renderHook(() => usePolicySession());

    act(() => {
      result.current.appendMessage({
        id: "test-msg-1",
        role: "user",
        content: "Generate a SLSA policy",
        timestamp: new Date().toISOString(),
      });
    });

    expect(result.current.session.messages).toHaveLength(1);
    expect(result.current.session.messages[0].content).toBe("Generate a SLSA policy");
  });

  test("newSession creates a fresh session", () => {
    const { result } = renderHook(() => usePolicySession());
    const firstId = result.current.session.id;

    act(() => {
      result.current.newSession();
    });

    expect(result.current.session.id).not.toBe(firstId);
    expect(result.current.session.messages).toHaveLength(0);
  });

  test("setArtifacts updates currentArtifacts and pushes to history", () => {
    const { result } = renderHook(() => usePolicySession());

    const artifacts = {
      rule: { filename: "policy.rego", content: "package test" },
      tests: { filename: "policy_test.rego", content: "package test_test" },
      config: { filename: "policy.yaml", content: "sources: []" },
      command: "ec validate image --image test:latest",
      version: 1,
    };

    act(() => {
      result.current.setArtifacts(artifacts);
    });

    expect(result.current.session.currentArtifacts).toEqual(artifacts);
    expect(result.current.session.artifactHistory).toHaveLength(0);

    const artifactsV2 = { ...artifacts, version: 2 };
    act(() => {
      result.current.setArtifacts(artifactsV2);
    });

    expect(result.current.session.currentArtifacts).toEqual(artifactsV2);
    expect(result.current.session.artifactHistory).toHaveLength(1);
    expect(result.current.session.artifactHistory[0].version).toBe(1);
  });

  test("sessions returns summary list", () => {
    const { result } = renderHook(() => usePolicySession());

    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0].id).toBe(result.current.session.id);
  });
});
