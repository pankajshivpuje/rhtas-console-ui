import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ArtifactPanel } from "./ArtifactPanel";
import type { PolicyArtifacts } from "../types";

vi.mock("react-syntax-highlighter", () => ({
  Prism: ({ children }: { children: string }) => <pre>{children}</pre>,
}));

vi.mock("react-syntax-highlighter/dist/cjs/styles/prism", () => ({
  atomDark: {},
}));

const mockArtifacts: PolicyArtifacts = {
  rule: { filename: "policy.rego", content: "package policy.test\nimport rego.v1" },
  tests: { filename: "policy_test.rego", content: "package policy.test_test" },
  config: { filename: "policy.yaml", content: "sources:\n  - policy:" },
  data: { filename: "allowed_sources.json", content: '{"allowed_builders":[]}' },
  command: "ec validate image --image test:latest",
  version: 1,
  testResults: { passed: 2, failed: 0, results: [] },
};

describe("ArtifactPanel", () => {
  test("renders tab labels", () => {
    render(
      <ArtifactPanel
        artifacts={mockArtifacts}
        artifactHistory={[]}
        isValidating={false}
        onRunTests={vi.fn()}
      />,
    );

    expect(screen.getByText("policy.rego")).toBeInTheDocument();
    expect(screen.getByText("policy_test.rego")).toBeInTheDocument();
    expect(screen.getByText("policy.yaml")).toBeInTheDocument();
    expect(screen.getByText("Command")).toBeInTheDocument();
  });

  test("shows rule content by default", () => {
    render(
      <ArtifactPanel
        artifacts={mockArtifacts}
        artifactHistory={[]}
        isValidating={false}
        onRunTests={vi.fn()}
      />,
    );

    expect(screen.getByText(/package policy.test/)).toBeInTheDocument();
  });

  test("switches tabs to show test content", () => {
    render(
      <ArtifactPanel
        artifacts={mockArtifacts}
        artifactHistory={[]}
        isValidating={false}
        onRunTests={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("policy_test.rego"));
    expect(screen.getByText("package policy.test_test")).toBeInTheDocument();
  });

  test("shows empty state when no artifacts", () => {
    render(
      <ArtifactPanel
        artifacts={null}
        artifactHistory={[]}
        isValidating={false}
        onRunTests={vi.fn()}
      />,
    );

    expect(screen.getByText(/artifacts will appear here/i)).toBeInTheDocument();
  });
});
