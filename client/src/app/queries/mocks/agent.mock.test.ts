import { describe, expect, test } from "vitest";
import { generateAgentResponse, agentInsightsMock, agentSummaryMock } from "./agent.mock";

describe("agent mock data", () => {
  test("agentInsightsMock has 8 insights", () => {
    expect(agentInsightsMock).toHaveLength(8);
  });

  test("agentSummaryMock counts match insights", () => {
    const criticals = agentInsightsMock.filter((i) => i.severity === "critical").length;
    const warnings = agentInsightsMock.filter((i) => i.severity === "warning").length;
    const infos = agentInsightsMock.filter((i) => i.severity === "info").length;
    expect(agentSummaryMock.criticalCount).toBe(criticals);
    expect(agentSummaryMock.warningCount).toBe(warnings);
    expect(agentSummaryMock.infoCount).toBe(infos);
    expect(agentSummaryMock.totalCount).toBe(criticals + warnings + infos);
  });

  test("generateAgentResponse routes attestation keywords", () => {
    const response = generateAgentResponse("Which artifacts are missing attestations?");
    expect(response.role).toBe("agent");
    expect(response.status).toBe("complete");
    expect(response.content).toContain("attestation");
  });

  test("generateAgentResponse routes certificate keywords", () => {
    const response = generateAgentResponse("When does the TUF root expire?");
    expect(response.content).toContain("TUF");
  });

  test("generateAgentResponse routes alert keywords", () => {
    const response = generateAgentResponse("Show me the unacknowledged alerts");
    expect(response.content).toContain("alert");
  });

  test("generateAgentResponse routes health keywords", () => {
    const response = generateAgentResponse("What is the status of the Rekor service?");
    expect(response.content).toContain("Rekor");
  });

  test("generateAgentResponse returns fallback for unknown queries", () => {
    const response = generateAgentResponse("What is the meaning of life?");
    expect(response.content).toContain("signing infrastructure health");
    expect(response.content).toContain("Try asking");
  });
});
