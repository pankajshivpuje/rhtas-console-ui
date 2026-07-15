# Agent Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a mock-only AI agent experience to the RHTAS Console that surfaces signing infrastructure health insights and responds to natural language queries.

**Architecture:** A new `/agent` page with InsightsDashboard + ChatPanel, a global AgentTrigger in the masthead header, and mock data backed by existing mock sources. Single-conversation mode with localStorage persistence. All API endpoints defined in OpenAPI but fully mocked in v1.

**Tech Stack:** React 18, PatternFly v6, React Query, react-markdown + remark-gfm, Vite, Vitest

## Global Constraints

- All new types come from OpenAPI codegen — define schemas in `client/openapi/console.yaml`, run `npm run generate`, import from `@app/client`.
- Mock data uses `useMockableQuery` from `@app/queries/helpers.ts` — real API calls swap in when `MOCK=off`.
- Follow existing patterns: `useMockableQuery` for queries, `useMutation` for mutations, key factories for React Query cache keys.
- New dependencies install in the `client` workspace: `npm install -w client <package>`.
- Page exports follow `export { ComponentName as default } from "./ComponentName"` pattern (see `client/src/app/pages/Alerts/index.ts`).
- Run `npm run test` after each task to verify no regressions.

---

### Task 1: OpenAPI Spec + Type Generation

**Files:**
- Modify: `client/openapi/console.yaml` (append after line 651 in paths, append after line 1651 in schemas)

**Interfaces:**
- Produces: `AgentInsight`, `AgentSummary`, `ChatMessage`, `AgentConversation`, `ChatRequest` types via codegen. Also produces `getAgentInsights`, `getAgentInsightsSummary`, `postAgentChat` SDK functions.

- [ ] **Step 1: Add Agent tag to the tags list**

In `client/openapi/console.yaml`, add a new tag after the existing `Policies` tag (around line 22):

```yaml
  - name: Agent
    description: AI agent insights and chat endpoints
```

- [ ] **Step 2: Add Agent path definitions**

Append after the last path entry (before `components:`). Add these paths:

```yaml
  /api/v1/agent/insights:
    get:
      summary: Get proactive agent findings
      tags:
        - Agent
      operationId: GetAgentInsights
      responses:
        '200':
          description: List of agent insights
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/AgentInsight'
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
  /api/v1/agent/insights/summary:
    get:
      summary: Get agent insight summary counts
      tags:
        - Agent
      operationId: GetAgentInsightsSummary
      responses:
        '200':
          description: Insight severity counts
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AgentSummary'
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
  /api/v1/agent/chat:
    post:
      summary: Send a message and get agent response
      tags:
        - Agent
      operationId: PostAgentChat
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ChatRequest'
      responses:
        '200':
          description: Agent response message
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ChatMessage'
        '400':
          description: Bad request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
```

- [ ] **Step 3: Add Agent schema definitions**

Append after the last schema entry (after `ArtifactFile`):

```yaml
    AgentInsight:
      type: object
      required:
        - id
        - severity
        - title
        - description
        - domain
        - timestamp
        - suggestedPrompt
      properties:
        id:
          type: string
        severity:
          type: string
          enum: [critical, warning, info]
        title:
          type: string
        description:
          type: string
        domain:
          type: string
          enum: [signing, attestations, trust-root, alerts, policy, health]
        timestamp:
          type: string
          format: date-time
        suggestedPrompt:
          type: string
        relatedLink:
          $ref: '#/components/schemas/AgentRelatedLink'
    AgentRelatedLink:
      type: object
      required:
        - label
        - path
      properties:
        label:
          type: string
        path:
          type: string
    AgentSummary:
      type: object
      required:
        - criticalCount
        - warningCount
        - infoCount
        - totalCount
      properties:
        criticalCount:
          type: integer
        warningCount:
          type: integer
        infoCount:
          type: integer
        totalCount:
          type: integer
    ChatMessage:
      type: object
      required:
        - id
        - role
        - content
        - timestamp
      properties:
        id:
          type: string
        role:
          type: string
          enum: [user, agent]
        content:
          type: string
        timestamp:
          type: string
          format: date-time
        insightId:
          type: string
        status:
          type: string
          enum: [sending, streaming, complete, error]
    ChatRequest:
      type: object
      required:
        - message
      properties:
        message:
          type: string
        conversationId:
          type: string
```

- [ ] **Step 4: Regenerate TypeScript types**

Run:
```bash
npm run generate
```

Expected: No errors. New types (`AgentInsight`, `AgentSummary`, `ChatMessage`, `ChatRequest`) appear in `client/src/app/client/types.gen.ts`.

- [ ] **Step 5: Verify types compile**

Run:
```bash
npm run lint
```

Expected: PASS — no type errors.

- [ ] **Step 6: Commit**

```bash
git add client/openapi/console.yaml
git commit -m "feat(agent): add Agent OpenAPI schemas and endpoints"
```

---

### Task 2: Mock Data + Response Generator

**Files:**
- Create: `client/src/app/queries/mocks/agent.mock.ts`

**Interfaces:**
- Consumes: `AgentInsight`, `AgentSummary`, `ChatMessage` from `@app/client` (Task 1)
- Consumes: `postureSummaryMock` from `./dashboard.mock`, `alertsMock`, `alertSummaryMock` from `./alerts.mock`, `trustRootMetadataInfoMock` from `./trust.mock`, `serviceHealthMock` from `./health.mock`
- Produces: `agentInsightsMock: AgentInsight[]`, `agentSummaryMock: AgentSummary`, `generateAgentResponse(userMessage: string): ChatMessage`

- [ ] **Step 1: Write test for generateAgentResponse keyword routing**

Create `client/src/app/queries/mocks/agent.mock.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm run test -w client -- client/src/app/queries/mocks/agent.mock.test.ts
```

Expected: FAIL — module `./agent.mock` does not exist.

- [ ] **Step 3: Write the mock data and response generator**

Create `client/src/app/queries/mocks/agent.mock.ts`:

```typescript
import type { AgentInsight, AgentSummary, ChatMessage } from "@app/client";

import { postureSummaryMock, allSignedArtifacts } from "./dashboard.mock";
import { alertsMock, alertSummaryMock } from "./alerts.mock";
import { trustRootMetadataInfoMock } from "./trust.mock";
import { serviceHealthMock } from "./health.mock";

export const agentInsightsMock: AgentInsight[] = [
  {
    id: "insight-1",
    severity: "critical",
    title: "TUF root metadata expires in 12 days",
    description: "The TUF root metadata is approaching expiration. If it expires, clients will be unable to verify trust anchors and signature verification will fail.",
    domain: "trust-root",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    suggestedPrompt: "Tell me more about the expiring TUF root and what I need to do",
    relatedLink: { label: "View Trust Root", path: "/trust-root" },
  },
  {
    id: "insight-2",
    severity: "critical",
    title: "Rekor transparency log returned errors",
    description: "The Rekor transparency log service is experiencing elevated error rates. Log entries may be delayed.",
    domain: "health",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    suggestedPrompt: "What is the current status of the Rekor service?",
    relatedLink: { label: "View System Health", path: "/operational-health" },
  },
  {
    id: "insight-3",
    severity: "warning",
    title: "27% of production artifacts lack attestations",
    description: "Several production artifacts have been signed but do not have associated attestations such as SLSA provenance or SBOM.",
    domain: "attestations",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    suggestedPrompt: "Which production artifacts are missing attestations?",
    relatedLink: { label: "View Trust Coverage", path: "/dashboard" },
  },
  {
    id: "insight-4",
    severity: "warning",
    title: "3 artifacts failing enterprise signing policy",
    description: "Three artifacts do not meet the enterprise signing policy requirements defined in Conforma.",
    domain: "policy",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    suggestedPrompt: "Show me the policy violations and affected artifacts",
    relatedLink: { label: "View Policy Evaluation", path: "/policy-generator" },
  },
  {
    id: "insight-5",
    severity: "warning",
    title: "Signing rate dropped 40% in the last 7 days",
    description: "The rate of new artifact signatures has decreased significantly compared to the previous week.",
    domain: "signing",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    suggestedPrompt: "What's causing the drop in signing activity?",
  },
  {
    id: "insight-6",
    severity: "warning",
    title: "2 unacknowledged critical alerts",
    description: "There are unacknowledged critical alerts that may require immediate attention.",
    domain: "alerts",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    suggestedPrompt: "Summarize the unacknowledged critical alerts",
    relatedLink: { label: "View Alerts", path: "/alerts" },
  },
  {
    id: "insight-7",
    severity: "info",
    title: "SBOM coverage increased to 85% this week",
    description: "Attestation coverage for SBOM (SPDX) documents has increased from 79% to 85% over the past 7 days.",
    domain: "attestations",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    suggestedPrompt: "Break down attestation coverage by type",
  },
  {
    id: "insight-8",
    severity: "info",
    title: "15 new artifacts signed in the last 24 hours",
    description: "Signing activity is ongoing with 15 new artifact signatures recorded in the last day.",
    domain: "signing",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    suggestedPrompt: "Summarize recent signing activity",
  },
];

export const agentSummaryMock: AgentSummary = {
  criticalCount: agentInsightsMock.filter((i) => i.severity === "critical").length,
  warningCount: agentInsightsMock.filter((i) => i.severity === "warning").length,
  infoCount: agentInsightsMock.filter((i) => i.severity === "info").length,
  totalCount: agentInsightsMock.length,
};

type KeywordRoute = {
  keywords: string[];
  generate: () => string;
};

const keywordRoutes: KeywordRoute[] = [
  {
    keywords: ["attestation", "attest", "sbom", "provenance"],
    generate: () => {
      const withAttestation = allSignedArtifacts.filter((a) => a.hasAttestation);
      const without = allSignedArtifacts.filter((a) => !a.hasAttestation);
      const coverage = allSignedArtifacts.length > 0
        ? ((withAttestation.length / allSignedArtifacts.length) * 100).toFixed(1)
        : "0";

      return `## Attestation Status\n\n` +
        `**${withAttestation.length}** of **${allSignedArtifacts.length}** signed artifacts have attestations (${coverage}% coverage).\n\n` +
        `### Artifacts without attestations\n\n` +
        `| Artifact | Environment | Last Seen |\n|----------|-------------|----------|\n` +
        without.map((a) => `| ${a.uri} | ${a.environment} | ${a.lastSeen} |`).join("\n") +
        `\n\nTo add attestations, use \`cosign attest\` with the appropriate predicate type (e.g., SLSA Provenance, SPDX SBOM).`;
    },
  },
  {
    keywords: ["certificate", "expir", "tuf", "root"],
    generate: () => {
      const metadata = trustRootMetadataInfoMock.data ?? [];
      return `## TUF Root Status\n\n` +
        `**Repository:** ${trustRootMetadataInfoMock["repo-url"]}\n\n` +
        `| Version | Status | Expires |\n|---------|--------|---------|\n` +
        metadata.map((m) => `| v${m.version} | ${m.status} | ${m.expires} |`).join("\n") +
        `\n\nIf the root metadata expires, clients cannot verify trust anchors and signature verification will fail. ` +
        `Rotate the TUF root before expiration using the \`tuf\` CLI tool.`;
    },
  },
  {
    keywords: ["policy", "violation", "compliance", "conforma"],
    generate: () => {
      return `## Policy Compliance\n\n` +
        `**3 artifacts** are currently failing the enterprise signing policy.\n\n` +
        `Common violations include:\n` +
        `- Missing SLSA provenance attestation\n` +
        `- Signature not from an authorized identity\n` +
        `- SBOM not attached to the image\n\n` +
        `Run artifact policy evaluation from the [Conforma page](/policy-generator) to see the full results.`;
    },
  },
  {
    keywords: ["health", "status", "service", "rekor", "fulcio"],
    generate: () => {
      const services = serviceHealthMock.services;
      return `## Service Health\n\n` +
        `**Overall:** ${serviceHealthMock.overallMessage}\n\n` +
        `| Service | Status | Detail |\n|---------|--------|--------|\n` +
        services.map((s) => `| ${s.name} | ${s.statusText} | ${s.detail} |`).join("\n") +
        (serviceHealthMock.overallDescription ? `\n\n${serviceHealthMock.overallDescription}` : "");
    },
  },
  {
    keywords: ["sign", "artifact", "coverage"],
    generate: () => {
      const summary = postureSummaryMock;
      return `## Signing Posture Summary\n\n` +
        `- **Signed artifacts:** ${summary.signedCount}\n` +
        `- **With attestations:** ${summary.signedWithAttestationCount}\n` +
        `- **Attestation coverage:** ${summary.attestationCoverage}%\n\n` +
        `Recent activity: 15 new artifacts signed in the last 24 hours.`;
    },
  },
  {
    keywords: ["alert", "incident", "firing"],
    generate: () => {
      const summary = alertSummaryMock;
      const unacked = alertsMock.filter((a) => !a.acknowledged);
      return `## Alert Summary\n\n` +
        `- **Total alerts:** ${summary.total}\n` +
        `- **Critical:** ${summary.critical}\n` +
        `- **Warning:** ${summary.warning}\n` +
        `- **Unacknowledged:** ${summary.unacknowledged}\n\n` +
        (unacked.length > 0
          ? `### Unacknowledged Alerts\n\n` +
            `| Alert | Severity | Status | Summary |\n|-------|----------|--------|----------|\n` +
            unacked.map((a) => `| ${a.alertName} | ${a.severity} | ${a.status} | ${a.summary} |`).join("\n")
          : "All alerts have been acknowledged.");
    },
  },
];

function generateFallbackResponse(): string {
  const summary = postureSummaryMock;
  const alerts = alertSummaryMock;
  return `I don't have specific information about that topic. Here's a summary of your current signing infrastructure health:\n\n` +
    `- **Signed artifacts:** ${summary.signedCount} total, ${summary.signedWithAttestationCount} with attestations (${summary.attestationCoverage}% coverage)\n` +
    `- **Active alerts:** ${alerts.critical} critical, ${alerts.warning} warning\n` +
    `- **Service health:** ${serviceHealthMock.overallMessage}\n\n` +
    `Try asking about specific topics like attestations, certificates, alerts, or signing activity.`;
}

export function generateAgentResponse(userMessage: string): ChatMessage {
  const lower = userMessage.toLowerCase();
  const matched = keywordRoutes.find((route) =>
    route.keywords.some((kw) => lower.includes(kw))
  );

  const content = matched ? matched.generate() : generateFallbackResponse();

  return {
    id: `msg-${Date.now()}`,
    role: "agent",
    content,
    timestamp: new Date().toISOString(),
    status: "complete",
  };
}
```

- [ ] **Step 4: Export allSignedArtifacts from dashboard.mock.ts**

The `allSignedArtifacts` array in `client/src/app/queries/mocks/dashboard.mock.ts` is not currently exported. Add `export` to its declaration:

Change line 38 from:
```typescript
const allSignedArtifacts: SignedArtifact[] = [
```
to:
```typescript
export const allSignedArtifacts: SignedArtifact[] = [
```

- [ ] **Step 5: Run tests to verify they pass**

Run:
```bash
npm run test -w client -- client/src/app/queries/mocks/agent.mock.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 6: Run full test suite for regressions**

Run:
```bash
npm run test
```

Expected: All tests pass. Exporting `allSignedArtifacts` doesn't break anything.

- [ ] **Step 7: Commit**

```bash
git add client/src/app/queries/mocks/agent.mock.ts client/src/app/queries/mocks/agent.mock.test.ts client/src/app/queries/mocks/dashboard.mock.ts
git commit -m "feat(agent): add mock data and keyword-routing response generator"
```

---

### Task 3: Query Hooks + Streaming Hook

**Files:**
- Create: `client/src/app/queries/agent.ts`
- Create: `client/src/app/hooks/useStreamingMessage.ts`
- Create: `client/src/app/hooks/useStreamingMessage.test.ts`

**Interfaces:**
- Consumes: `AgentInsight`, `AgentSummary`, `ChatMessage` from `@app/client` (Task 1); `agentInsightsMock`, `agentSummaryMock`, `generateAgentResponse` from `@app/queries/mocks/agent.mock` (Task 2); `useMockableQuery` from `@app/queries/helpers`
- Produces: `useFetchInsights()`, `useFetchInsightSummary()`, `useSendChatMessage()`, `AgentKeys`, `useStreamingMessage(content, isActive)`

- [ ] **Step 1: Write test for useStreamingMessage**

Create `client/src/app/hooks/useStreamingMessage.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm run test -w client -- client/src/app/hooks/useStreamingMessage.test.ts
```

Expected: FAIL — module `./useStreamingMessage` does not exist.

- [ ] **Step 3: Implement useStreamingMessage**

Create `client/src/app/hooks/useStreamingMessage.ts`:

```typescript
import { useEffect, useRef, useState } from "react";

export function useStreamingMessage(
  content: string | undefined,
  isActive: boolean
): { displayedContent: string; isStreaming: boolean } {
  const [displayedContent, setDisplayedContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const intervalRef = useRef<number>();

  useEffect(() => {
    if (!content || !isActive) {
      return;
    }

    setIsStreaming(true);
    setDisplayedContent("");
    let index = 0;

    intervalRef.current = window.setInterval(() => {
      index += Math.floor(Math.random() * 3) + 1;
      if (index >= content.length) {
        setDisplayedContent(content);
        setIsStreaming(false);
        clearInterval(intervalRef.current);
      } else {
        setDisplayedContent(content.slice(0, index));
      }
    }, 15);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [content, isActive]);

  return { displayedContent, isStreaming };
}
```

- [ ] **Step 4: Run streaming hook tests**

Run:
```bash
npm run test -w client -- client/src/app/hooks/useStreamingMessage.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Write the query hooks**

Create `client/src/app/queries/agent.ts`:

```typescript
import type { AxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";

import ENV from "@app/env";
import { client } from "@app/axios-config/apiInit";
import {
  getAgentInsights,
  getAgentInsightsSummary,
  postAgentChat,
  type AgentInsight,
  type AgentSummary,
  type ChatMessage,
  type Error as ApiError,
} from "@app/client";

import { useMockableQuery } from "./helpers";
import { agentInsightsMock, agentSummaryMock, generateAgentResponse } from "./mocks/agent.mock";

export const AgentKeys = {
  insights: ["Agent", "insights"] as const,
  insightSummary: ["Agent", "insights", "summary"] as const,
};

export const useFetchInsights = () => {
  const { data, isLoading, error } = useMockableQuery<AgentInsight[], AxiosError<ApiError>>(
    {
      queryKey: AgentKeys.insights,
      queryFn: async () => {
        const response = await getAgentInsights({ client });
        return (response.data ?? []) as AgentInsight[];
      },
      refetchInterval: 60000,
    },
    agentInsightsMock
  );

  return {
    insights: data ?? [],
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useFetchInsightSummary = () => {
  const { data, isLoading, error } = useMockableQuery<AgentSummary, AxiosError<ApiError>>(
    {
      queryKey: AgentKeys.insightSummary,
      queryFn: async () => {
        const response = await getAgentInsightsSummary({ client });
        return response.data as AgentSummary;
      },
      refetchInterval: 60000,
    },
    agentSummaryMock
  );

  return {
    summary: data,
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useSendChatMessage = () => {
  const mutation = useMutation<ChatMessage, AxiosError<ApiError>, { message: string }>({
    mutationFn: async ({ message }) => {
      if (ENV.MOCK !== "off") {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return generateAgentResponse(message);
      }
      const response = await postAgentChat({
        client,
        body: { message },
      });
      return response.data as ChatMessage;
    },
  });

  return {
    sendMessage: mutation.mutate,
    data: mutation.data,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};
```

- [ ] **Step 6: Verify lint passes**

Run:
```bash
npm run lint
```

Expected: PASS — all imports resolve, types match.

- [ ] **Step 7: Commit**

```bash
git add client/src/app/queries/agent.ts client/src/app/hooks/useStreamingMessage.ts client/src/app/hooks/useStreamingMessage.test.ts
git commit -m "feat(agent): add query hooks and streaming message hook"
```

---

### Task 4: Install Dependencies + ChatInput + ChatMessage + AgentResponseContent

**Files:**
- Create: `client/src/app/pages/Agent/components/ChatInput.tsx`
- Create: `client/src/app/pages/Agent/components/ChatMessage.tsx`
- Create: `client/src/app/pages/Agent/components/AgentResponseContent.tsx`

**Interfaces:**
- Consumes: `ChatMessage` type from `@app/client` (Task 1)
- Produces: `<ChatInput onSend={fn} suggestedPrompts={string[]} disabled={boolean} initialValue={string} />`, `<ChatMessage message={ChatMessage} displayContent={string} isStreaming={boolean} />`, `<AgentResponseContent content={string} />`

- [ ] **Step 1: Install react-markdown and remark-gfm**

Run:
```bash
npm install -w client react-markdown remark-gfm
```

Expected: Packages added to `client/package.json` dependencies.

- [ ] **Step 2: Write tests for ChatInput**

Create `client/src/app/pages/Agent/components/ChatInput.test.tsx`:

```typescript
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run:
```bash
npm run test -w client -- client/src/app/pages/Agent/components/ChatInput.test.tsx
```

Expected: FAIL — module `./ChatInput` does not exist.

- [ ] **Step 4: Implement ChatInput**

Create `client/src/app/pages/Agent/components/ChatInput.tsx`:

```tsx
import React, { useState } from "react";
import { Button, Chip, ChipGroup, Flex, FlexItem, TextInput } from "@patternfly/react-core";
import PaperPlaneIcon from "@patternfly/react-icons/dist/esm/icons/paper-plane-icon";

interface ChatInputProps {
  onSend: (message: string) => void;
  suggestedPrompts?: string[];
  disabled?: boolean;
  initialValue?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  suggestedPrompts,
  disabled = false,
  initialValue = "",
}) => {
  const [value, setValue] = useState(initialValue);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div>
      {suggestedPrompts && suggestedPrompts.length > 0 && (
        <ChipGroup categoryName="Suggested" style={{ marginBottom: "var(--pf-t--global--spacer--sm)" }}>
          {suggestedPrompts.map((prompt) => (
            <Chip
              key={prompt}
              onClick={() => onSend(prompt)}
              isReadOnly
              component="button"
            >
              {prompt}
            </Chip>
          ))}
        </ChipGroup>
      )}
      <Flex>
        <FlexItem flex={{ default: "flex_1" }}>
          <TextInput
            type="text"
            value={value}
            onChange={(_event, val) => setValue(val)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the agent a question..."
            aria-label="Chat message input"
            isDisabled={disabled}
          />
        </FlexItem>
        <FlexItem>
          <Button
            variant="primary"
            onClick={handleSend}
            isDisabled={disabled || !value.trim()}
            aria-label="Send message"
            icon={<PaperPlaneIcon />}
          />
        </FlexItem>
      </Flex>
    </div>
  );
};
```

- [ ] **Step 5: Implement AgentResponseContent**

Create `client/src/app/pages/Agent/components/AgentResponseContent.tsx`:

```tsx
import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AgentResponseContentProps {
  content: string;
}

export const AgentResponseContent: React.FC<AgentResponseContentProps> = ({ content }) => {
  return (
    <Markdown remarkPlugins={[remarkGfm]}>
      {content}
    </Markdown>
  );
};
```

- [ ] **Step 6: Implement ChatMessage component**

Create `client/src/app/pages/Agent/components/ChatMessage.tsx`:

```tsx
import React from "react";
import { Flex, FlexItem, Icon } from "@patternfly/react-core";
import OutlinedRobotIcon from "@patternfly/react-icons/dist/esm/icons/robot-icon";
import UserIcon from "@patternfly/react-icons/dist/esm/icons/user-icon";

import type { ChatMessage as ChatMessageType } from "@app/client";

import { AgentResponseContent } from "./AgentResponseContent";

interface ChatMessageProps {
  message: ChatMessageType;
  displayContent?: string;
  isStreaming?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  displayContent,
  isStreaming = false,
}) => {
  const isAgent = message.role === "agent";
  const content = displayContent ?? message.content;

  return (
    <Flex
      justifyContent={{ default: isAgent ? "justifyContentFlexStart" : "justifyContentFlexEnd" }}
      style={{ marginBottom: "var(--pf-t--global--spacer--md)" }}
    >
      {isAgent && (
        <FlexItem>
          <Icon size="lg">
            <OutlinedRobotIcon />
          </Icon>
        </FlexItem>
      )}
      <FlexItem
        style={{
          maxWidth: "75%",
          padding: "var(--pf-t--global--spacer--sm) var(--pf-t--global--spacer--md)",
          borderRadius: "var(--pf-t--global--border--radius--medium)",
          backgroundColor: isAgent
            ? "var(--pf-t--global--background--color--secondary--default)"
            : "var(--pf-t--global--color--brand--default)",
          color: isAgent ? undefined : "var(--pf-t--global--text--color--on-brand--default)",
        }}
      >
        {isAgent ? (
          <AgentResponseContent content={content} />
        ) : (
          <p>{content}</p>
        )}
        {isStreaming && <span className="pf-v6-c-spinner pf-m-sm" role="progressbar" />}
        <div style={{ fontSize: "var(--pf-t--global--font--size--xs)", opacity: 0.7, marginTop: "var(--pf-t--global--spacer--xs)" }}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </FlexItem>
      {!isAgent && (
        <FlexItem>
          <Icon size="lg">
            <UserIcon />
          </Icon>
        </FlexItem>
      )}
    </Flex>
  );
};
```

- [ ] **Step 7: Run ChatInput tests**

Run:
```bash
npm run test -w client -- client/src/app/pages/Agent/components/ChatInput.test.tsx
```

Expected: All 7 tests PASS.

- [ ] **Step 8: Commit**

```bash
git add client/src/app/pages/Agent/components/ChatInput.tsx client/src/app/pages/Agent/components/ChatInput.test.tsx client/src/app/pages/Agent/components/ChatMessage.tsx client/src/app/pages/Agent/components/AgentResponseContent.tsx client/package.json client/package-lock.json
git commit -m "feat(agent): add ChatInput, ChatMessage, and AgentResponseContent components"
```

---

### Task 5: InsightCard + InsightsDashboard

**Files:**
- Create: `client/src/app/pages/Agent/components/InsightCard.tsx`
- Create: `client/src/app/pages/Agent/components/InsightCard.test.tsx`
- Create: `client/src/app/pages/Agent/components/InsightsDashboard.tsx`

**Interfaces:**
- Consumes: `AgentInsight` from `@app/client` (Task 1)
- Produces: `<InsightCard insight={AgentInsight} onClick={fn} />`, `<InsightsDashboard insights={AgentInsight[]} onInsightClick={fn} />`

- [ ] **Step 1: Write InsightCard tests**

Create `client/src/app/pages/Agent/components/InsightCard.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import type { AgentInsight } from "@app/client";
import { InsightCard } from "./InsightCard";

const mockInsight: AgentInsight = {
  id: "test-1",
  severity: "critical",
  title: "TUF root expires soon",
  description: "The root metadata is approaching expiration.",
  domain: "trust-root",
  timestamp: "2026-07-14T10:00:00Z",
  suggestedPrompt: "Tell me about the TUF root",
};

describe("InsightCard", () => {
  test("renders title and description", () => {
    render(<InsightCard insight={mockInsight} onClick={vi.fn()} />);
    expect(screen.getByText("TUF root expires soon")).toBeInTheDocument();
    expect(screen.getByText("The root metadata is approaching expiration.")).toBeInTheDocument();
  });

  test("renders severity label", () => {
    render(<InsightCard insight={mockInsight} onClick={vi.fn()} />);
    expect(screen.getByText("Critical")).toBeInTheDocument();
  });

  test("renders domain label", () => {
    render(<InsightCard insight={mockInsight} onClick={vi.fn()} />);
    expect(screen.getByText("Trust Root")).toBeInTheDocument();
  });

  test("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<InsightCard insight={mockInsight} onClick={onClick} />);

    await userEvent.click(screen.getByText("TUF root expires soon"));
    expect(onClick).toHaveBeenCalledWith(mockInsight);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm run test -w client -- client/src/app/pages/Agent/components/InsightCard.test.tsx
```

Expected: FAIL — module `./InsightCard` does not exist.

- [ ] **Step 3: Implement InsightCard**

Create `client/src/app/pages/Agent/components/InsightCard.tsx`:

```tsx
import React from "react";
import { Card, CardBody, CardFooter, CardTitle, Flex, FlexItem, Label } from "@patternfly/react-core";
import { ExclamationCircleIcon, ExclamationTriangleIcon, InfoCircleIcon } from "@patternfly/react-icons";

import type { AgentInsight } from "@app/client";

interface InsightCardProps {
  insight: AgentInsight;
  onClick: (insight: AgentInsight) => void;
}

const severityConfig = {
  critical: { color: "red" as const, icon: <ExclamationCircleIcon />, label: "Critical" },
  warning: { color: "orange" as const, icon: <ExclamationTriangleIcon />, label: "Warning" },
  info: { color: "blue" as const, icon: <InfoCircleIcon />, label: "Info" },
};

const domainLabels: Record<string, string> = {
  signing: "Signing",
  attestations: "Attestations",
  "trust-root": "Trust Root",
  alerts: "Alerts",
  policy: "Policy",
  health: "Health",
};

export const InsightCard: React.FC<InsightCardProps> = ({ insight, onClick }) => {
  const config = severityConfig[insight.severity];

  return (
    <Card isSelectable isClickable onClick={() => onClick(insight)}>
      <CardTitle>
        <Flex justifyContent={{ default: "justifyContentSpaceBetween" }}>
          <FlexItem>{insight.title}</FlexItem>
          <FlexItem>
            <Label color={config.color} icon={config.icon}>
              {config.label}
            </Label>
          </FlexItem>
        </Flex>
      </CardTitle>
      <CardBody>{insight.description}</CardBody>
      <CardFooter>
        <Flex justifyContent={{ default: "justifyContentSpaceBetween" }}>
          <FlexItem>
            <Label variant="outline">{domainLabels[insight.domain] ?? insight.domain}</Label>
          </FlexItem>
          <FlexItem style={{ fontSize: "var(--pf-t--global--font--size--xs)", opacity: 0.7 }}>
            {new Date(insight.timestamp).toLocaleString()}
          </FlexItem>
        </Flex>
      </CardFooter>
    </Card>
  );
};
```

- [ ] **Step 4: Implement InsightsDashboard**

Create `client/src/app/pages/Agent/components/InsightsDashboard.tsx`:

```tsx
import React from "react";
import {
  EmptyState,
  EmptyStateBody,
  Flex,
  FlexItem,
  Gallery,
  GalleryItem,
  Label,
} from "@patternfly/react-core";
import { CheckCircleIcon } from "@patternfly/react-icons";

import type { AgentInsight } from "@app/client";

import { InsightCard } from "./InsightCard";

interface InsightsDashboardProps {
  insights: AgentInsight[];
  onInsightClick: (insight: AgentInsight) => void;
}

export const InsightsDashboard: React.FC<InsightsDashboardProps> = ({
  insights,
  onInsightClick,
}) => {
  const criticalCount = insights.filter((i) => i.severity === "critical").length;
  const warningCount = insights.filter((i) => i.severity === "warning").length;
  const infoCount = insights.filter((i) => i.severity === "info").length;

  if (insights.length === 0) {
    return (
      <EmptyState headingLevel="h3" titleText="No Issues Detected" icon={CheckCircleIcon}>
        <EmptyStateBody>
          Your signing infrastructure looks healthy.
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <div>
      <Flex gap={{ default: "gapMd" }} style={{ marginBottom: "var(--pf-t--global--spacer--md)" }}>
        {criticalCount > 0 && (
          <FlexItem>
            <Label color="red">{criticalCount} Critical</Label>
          </FlexItem>
        )}
        {warningCount > 0 && (
          <FlexItem>
            <Label color="orange">{warningCount} Warning{warningCount !== 1 ? "s" : ""}</Label>
          </FlexItem>
        )}
        {infoCount > 0 && (
          <FlexItem>
            <Label color="blue">{infoCount} Info</Label>
          </FlexItem>
        )}
      </Flex>
      <Gallery hasGutter minWidths={{ default: "300px" }}>
        {insights.map((insight) => (
          <GalleryItem key={insight.id}>
            <InsightCard insight={insight} onClick={onInsightClick} />
          </GalleryItem>
        ))}
      </Gallery>
    </div>
  );
};
```

- [ ] **Step 5: Run InsightCard tests**

Run:
```bash
npm run test -w client -- client/src/app/pages/Agent/components/InsightCard.test.tsx
```

Expected: All 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add client/src/app/pages/Agent/components/InsightCard.tsx client/src/app/pages/Agent/components/InsightCard.test.tsx client/src/app/pages/Agent/components/InsightsDashboard.tsx
git commit -m "feat(agent): add InsightCard and InsightsDashboard components"
```

---

### Task 6: ChatPanel + Agent Page + Route + Sidebar

**Files:**
- Create: `client/src/app/pages/Agent/components/ChatPanel.tsx`
- Create: `client/src/app/pages/Agent/Agent.tsx`
- Create: `client/src/app/pages/Agent/index.ts`
- Create: `client/src/app/pages/Agent/Agent.test.tsx`
- Modify: `client/src/app/Routes.tsx`
- Modify: `client/src/app/layout/sidebar.tsx`

**Interfaces:**
- Consumes: `useFetchInsights`, `useSendChatMessage` from `@app/queries/agent` (Task 3); `ChatInput`, `ChatMessage`, `InsightsDashboard` (Tasks 4-5); `useStreamingMessage` from `@app/hooks/useStreamingMessage` (Task 3)
- Produces: `<Agent />` page at `/agent`, sidebar nav entry, `<ChatPanel />` with localStorage persistence

- [ ] **Step 1: Implement ChatPanel**

Create `client/src/app/pages/Agent/components/ChatPanel.tsx`:

```tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, CardBody, CardHeader, CardTitle, Flex, FlexItem, Alert } from "@patternfly/react-core";
import PlusCircleIcon from "@patternfly/react-icons/dist/esm/icons/plus-circle-icon";

import type { ChatMessage as ChatMessageType } from "@app/client";
import { useStreamingMessage } from "@app/hooks/useStreamingMessage";
import { useSendChatMessage } from "@app/queries/agent";

import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";

const STORAGE_KEY = "rhtas-agent-conversation";

const defaultSuggestedPrompts = [
  "What is the overall health of my signing infrastructure?",
  "Which production artifacts are missing attestations?",
  "When does the TUF root expire?",
  "Summarize the unacknowledged critical alerts",
];

interface ChatPanelProps {
  initialPrompt?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ initialPrompt }) => {
  const [messages, setMessages] = useState<ChatMessageType[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const { sendMessage, data: agentResponse, isPending, error: sendError } = useSendChatMessage();
  const { displayedContent, isStreaming } = useStreamingMessage(
    agentResponse?.content,
    !!agentResponse
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialPromptSent = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // localStorage full or unavailable
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, displayedContent]);

  useEffect(() => {
    if (agentResponse && !isStreaming && agentResponse.status === "complete") {
      setMessages((prev) => {
        if (prev.some((m) => m.id === agentResponse.id)) return prev;
        return [...prev, agentResponse];
      });
    }
  }, [agentResponse, isStreaming]);

  const handleSend = useCallback(
    (text: string) => {
      const userMessage: ChatMessageType = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
        status: "complete",
      };
      setMessages((prev) => [...prev, userMessage]);
      sendMessage({ message: text });
    },
    [sendMessage]
  );

  useEffect(() => {
    if (initialPrompt && !initialPromptSent.current) {
      initialPromptSent.current = true;
      handleSend(initialPrompt);
    }
  }, [initialPrompt, handleSend]);

  const handleNewConversation = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <Card>
      <CardHeader
        actions={{
          actions: (
            <Button variant="link" icon={<PlusCircleIcon />} onClick={handleNewConversation}>
              New conversation
            </Button>
          ),
          hasNoOffset: true,
        }}
      >
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <CardBody>
        <div style={{ minHeight: "300px", maxHeight: "500px", overflowY: "auto", marginBottom: "var(--pf-t--global--spacer--md)" }}>
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isPending && agentResponse && isStreaming && (
            <ChatMessage
              message={agentResponse}
              displayContent={displayedContent}
              isStreaming
            />
          )}
          <div ref={messagesEndRef} />
        </div>

        {sendError && (
          <Alert variant="danger" isInline isPlain title="Failed to send message. Please try again." style={{ marginBottom: "var(--pf-t--global--spacer--sm)" }} />
        )}

        <ChatInput
          onSend={handleSend}
          disabled={isPending}
          suggestedPrompts={messages.length === 0 ? defaultSuggestedPrompts : undefined}
        />
      </CardBody>
    </Card>
  );
};
```

- [ ] **Step 2: Implement Agent page**

Create `client/src/app/pages/Agent/Agent.tsx`:

```tsx
import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Content,
  EmptyState,
  EmptyStateBody,
  PageSection,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";

import { DocumentMetadata } from "@app/components/DocumentMetadata";
import { LoadingWrapper } from "@app/components/LoadingWrapper";
import { useFetchInsights } from "@app/queries/agent";
import type { AgentInsight } from "@app/client";

import { InsightsDashboard } from "./components/InsightsDashboard";
import { ChatPanel } from "./components/ChatPanel";

export const Agent: React.FC = () => {
  const [searchParams] = useSearchParams();
  const promptParam = searchParams.get("prompt");

  const { insights, isFetching, fetchError } = useFetchInsights();
  const [promptToSend, setPromptToSend] = useState<string | undefined>(promptParam ?? undefined);

  const handleInsightClick = (insight: AgentInsight) => {
    setPromptToSend(insight.suggestedPrompt);
  };

  return (
    <>
      <DocumentMetadata title="Agent" />
      <PageSection>
        <Stack hasGutter>
          <StackItem>
            <Content>
              <h2>Agent</h2>
              <p>
                AI-powered monitoring of your signing infrastructure. Review insights and ask questions.
              </p>
            </Content>
          </StackItem>

          <StackItem>
            <LoadingWrapper isFetching={isFetching} fetchError={fetchError}>
              <InsightsDashboard
                insights={insights}
                onInsightClick={handleInsightClick}
              />
            </LoadingWrapper>
          </StackItem>

          <StackItem>
            <ChatPanel initialPrompt={promptToSend} />
          </StackItem>
        </Stack>
      </PageSection>
    </>
  );
};
```

- [ ] **Step 3: Create index.ts export**

Create `client/src/app/pages/Agent/index.ts`:

```typescript
export { Agent as default } from "./Agent";
```

- [ ] **Step 4: Add route and sidebar navigation**

In `client/src/app/Routes.tsx`, add the lazy import after the existing imports (after line 17):

```typescript
const Agent = lazy(() => import("./pages/Agent"));
```

Add `agent` to the `Paths` object (after `dashboard`):

```typescript
agent: "/agent",
```

Add the route entry in the `useRoutes` array (after the dashboard route):

```typescript
{ path: Paths.agent, element: <Agent /> },
```

In `client/src/app/layout/sidebar.tsx`, add the Agent nav item after the "System Health" `<li>` (after line 27):

```tsx
<li className={nav.navItem}>
  <NavLink
    to={Paths.agent}
    className={({ isActive }) => {
      return css(LINK_CLASS, isActive ? ACTIVE_LINK_CLASS : "");
    }}
  >
    Agent{" "}
    <span
      style={{
        backgroundColor: "var(--pf-t--global--color--brand--default)",
        color: "var(--pf-t--global--text--color--on-brand--default)",
        borderRadius: "var(--pf-t--global--border--radius--pill)",
        padding: "0 var(--pf-t--global--spacer--xs)",
        fontSize: "var(--pf-t--global--font--size--xs)",
        marginLeft: "var(--pf-t--global--spacer--xs)",
      }}
    >
      New
    </span>
  </NavLink>
</li>
```

- [ ] **Step 5: Write Agent page integration test**

Create `client/src/app/pages/Agent/Agent.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { Agent } from "./Agent";
import type { AgentInsight } from "@app/client";

vi.mock("@app/components/DocumentMetadata", () => ({
  DocumentMetadata: () => null,
}));

vi.mock("@app/queries/agent", () => ({
  useFetchInsights: vi.fn(),
  useSendChatMessage: vi.fn(),
}));

import { useFetchInsights, useSendChatMessage } from "@app/queries/agent";
const mockUseFetchInsights = vi.mocked(useFetchInsights);
const mockUseSendChatMessage = vi.mocked(useSendChatMessage);

const fakeInsights: AgentInsight[] = [
  {
    id: "insight-1",
    severity: "critical",
    title: "TUF root expires soon",
    description: "Root metadata approaching expiration.",
    domain: "trust-root",
    timestamp: "2026-07-14T10:00:00Z",
    suggestedPrompt: "Tell me about the TUF root",
  },
];

describe("Agent page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFetchInsights.mockReturnValue({
      insights: [],
      isFetching: false,
      fetchError: null,
    });
    mockUseSendChatMessage.mockReturnValue({
      sendMessage: vi.fn(),
      data: undefined,
      isPending: false,
      error: null,
    });
  });

  test("renders Agent heading", () => {
    render(<MemoryRouter><Agent /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Agent" })).toBeInTheDocument();
  });

  test("shows empty state when no insights", () => {
    render(<MemoryRouter><Agent /></MemoryRouter>);
    expect(screen.getByText("Your signing infrastructure looks healthy.")).toBeInTheDocument();
  });

  test("renders insight cards when data is available", () => {
    mockUseFetchInsights.mockReturnValue({
      insights: fakeInsights,
      isFetching: false,
      fetchError: null,
    });

    render(<MemoryRouter><Agent /></MemoryRouter>);
    expect(screen.getByText("TUF root expires soon")).toBeInTheDocument();
    expect(screen.getByText("1 Critical")).toBeInTheDocument();
  });

  test("renders chat panel with suggested prompts", () => {
    render(<MemoryRouter><Agent /></MemoryRouter>);
    expect(screen.getByPlaceholderText("Ask the agent a question...")).toBeInTheDocument();
  });

  test("loading state shows spinner", () => {
    mockUseFetchInsights.mockReturnValue({
      insights: [],
      isFetching: true,
      fetchError: null,
    });

    render(<MemoryRouter><Agent /></MemoryRouter>);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run Agent tests**

Run:
```bash
npm run test -w client -- client/src/app/pages/Agent/Agent.test.tsx
```

Expected: All 5 tests PASS.

- [ ] **Step 7: Run full test suite**

Run:
```bash
npm run test
```

Expected: All tests pass — no regressions from route/sidebar changes.

- [ ] **Step 8: Commit**

```bash
git add client/src/app/pages/Agent/ client/src/app/Routes.tsx client/src/app/layout/sidebar.tsx
git commit -m "feat(agent): add Agent page with InsightsDashboard and ChatPanel"
```

---

### Task 7: AgentTrigger in Masthead

**Files:**
- Create: `client/src/app/components/AgentTrigger/AgentTrigger.tsx`
- Create: `client/src/app/components/AgentTrigger/AgentPopover.tsx`
- Create: `client/src/app/components/AgentTrigger/AgentTrigger.test.tsx`
- Modify: `client/src/app/layout/header.tsx`

**Interfaces:**
- Consumes: `useFetchInsightSummary`, `useFetchInsights` from `@app/queries/agent` (Task 3); `Paths` from `@app/Routes` (Task 6)
- Produces: `<AgentTrigger />` component rendered in masthead header

- [ ] **Step 1: Write AgentTrigger test**

Create `client/src/app/components/AgentTrigger/AgentTrigger.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { AgentTrigger } from "./AgentTrigger";

vi.mock("@app/queries/agent", () => ({
  useFetchInsightSummary: vi.fn(),
  useFetchInsights: vi.fn(),
}));

import { useFetchInsightSummary, useFetchInsights } from "@app/queries/agent";
const mockUseFetchInsightSummary = vi.mocked(useFetchInsightSummary);
const mockUseFetchInsights = vi.mocked(useFetchInsights);

describe("AgentTrigger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFetchInsightSummary.mockReturnValue({
      summary: { criticalCount: 2, warningCount: 3, infoCount: 1, totalCount: 6 },
      isFetching: false,
      fetchError: null,
    });
    mockUseFetchInsights.mockReturnValue({
      insights: [],
      isFetching: false,
      fetchError: null,
    });
  });

  test("renders agent button", () => {
    render(<MemoryRouter><AgentTrigger /></MemoryRouter>);
    expect(screen.getByLabelText("Agent insights")).toBeInTheDocument();
  });

  test("shows badge with total count", () => {
    render(<MemoryRouter><AgentTrigger /></MemoryRouter>);
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  test("hides badge when count is 0", () => {
    mockUseFetchInsightSummary.mockReturnValue({
      summary: { criticalCount: 0, warningCount: 0, infoCount: 0, totalCount: 0 },
      isFetching: false,
      fetchError: null,
    });

    render(<MemoryRouter><AgentTrigger /></MemoryRouter>);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm run test -w client -- client/src/app/components/AgentTrigger/AgentTrigger.test.tsx
```

Expected: FAIL — module `./AgentTrigger` does not exist.

- [ ] **Step 3: Implement AgentPopover**

Create `client/src/app/components/AgentTrigger/AgentPopover.tsx`:

```tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Flex,
  FlexItem,
  Label,
  Popover,
  TextInput,
} from "@patternfly/react-core";
import { ExclamationCircleIcon, ExclamationTriangleIcon, InfoCircleIcon } from "@patternfly/react-icons";

import type { AgentInsight } from "@app/client";
import { Paths } from "@app/Routes";

interface AgentPopoverProps {
  insights: AgentInsight[];
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  isVisible: boolean;
  onClose: () => void;
}

const severityIcons = {
  critical: <ExclamationCircleIcon color="var(--pf-t--global--icon--color--severity--critical--default)" />,
  warning: <ExclamationTriangleIcon color="var(--pf-t--global--icon--color--severity--warning--default)" />,
  info: <InfoCircleIcon color="var(--pf-t--global--icon--color--severity--info--default)" />,
};

export const AgentPopover: React.FC<AgentPopoverProps> = ({
  insights,
  triggerRef,
  isVisible,
  onClose,
}) => {
  const navigate = useNavigate();
  const [quickPrompt, setQuickPrompt] = useState("");
  const topInsights = insights.slice(0, 3);

  const handleQuickPromptSend = () => {
    if (!quickPrompt.trim()) return;
    navigate(`${Paths.agent}?prompt=${encodeURIComponent(quickPrompt.trim())}`);
    onClose();
  };

  return (
    <Popover
      isVisible={isVisible}
      shouldClose={onClose}
      triggerRef={triggerRef}
      headerContent="Agent Insights"
      bodyContent={
        <div>
          {topInsights.length > 0 ? (
            topInsights.map((insight) => (
              <Flex
                key={insight.id}
                gap={{ default: "gapSm" }}
                alignItems={{ default: "alignItemsCenter" }}
                style={{ padding: "var(--pf-t--global--spacer--xs) 0", cursor: "pointer" }}
                onClick={() => {
                  navigate(`${Paths.agent}?prompt=${encodeURIComponent(insight.suggestedPrompt)}`);
                  onClose();
                }}
              >
                <FlexItem>{severityIcons[insight.severity]}</FlexItem>
                <FlexItem>{insight.title}</FlexItem>
              </Flex>
            ))
          ) : (
            <p>No issues detected.</p>
          )}
        </div>
      }
      footerContent={
        <div style={{ width: "100%" }}>
          <Button variant="link" onClick={() => { navigate(Paths.agent); onClose(); }} style={{ marginBottom: "var(--pf-t--global--spacer--sm)" }}>
            View all insights
          </Button>
          <Flex>
            <FlexItem flex={{ default: "flex_1" }}>
              <TextInput
                type="text"
                value={quickPrompt}
                onChange={(_e, val) => setQuickPrompt(val)}
                onKeyDown={(e) => e.key === "Enter" && handleQuickPromptSend()}
                placeholder="Ask the agent..."
                aria-label="Quick agent prompt"
              />
            </FlexItem>
          </Flex>
        </div>
      }
    />
  );
};
```

- [ ] **Step 4: Implement AgentTrigger**

Create `client/src/app/components/AgentTrigger/AgentTrigger.tsx`:

```tsx
import React, { useRef, useState } from "react";
import { Badge, Button } from "@patternfly/react-core";
import RobotIcon from "@patternfly/react-icons/dist/esm/icons/robot-icon";

import { useFetchInsightSummary, useFetchInsights } from "@app/queries/agent";

import { AgentPopover } from "./AgentPopover";

export const AgentTrigger: React.FC = () => {
  const { summary } = useFetchInsightSummary();
  const { insights } = useFetchInsights();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const totalCount = summary?.totalCount ?? 0;

  return (
    <>
      <Button
        ref={buttonRef}
        variant="plain"
        aria-label="Agent insights"
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
      >
        <RobotIcon />
        {totalCount > 0 && (
          <Badge isRead={false} style={{ marginLeft: "var(--pf-t--global--spacer--xs)" }}>
            {totalCount}
          </Badge>
        )}
      </Button>
      <AgentPopover
        insights={insights}
        triggerRef={buttonRef}
        isVisible={isPopoverOpen}
        onClose={() => setIsPopoverOpen(false)}
      />
    </>
  );
};
```

- [ ] **Step 5: Add AgentTrigger to header.tsx**

In `client/src/app/layout/header.tsx`, add the import near the top (after line 36):

```typescript
import { AgentTrigger } from "@app/components/AgentTrigger/AgentTrigger";
```

In the desktop toolbar group (`id="header-toolbar-desktop"`), add a new `ToolbarItem` between the `NotificationBadge` `ToolbarItem` (line 121-127) and the `DarkModeToggle` `ToolbarItem` (line 128-130):

```tsx
<ToolbarItem>
  <AgentTrigger />
</ToolbarItem>
```

In the mobile toolbar group (`id="header-toolbar-mobile"`), add the same `ToolbarItem` between the `NotificationBadge` (line 180-186) and `DarkModeToggle` (line 187-189):

```tsx
<ToolbarItem>
  <AgentTrigger />
</ToolbarItem>
```

- [ ] **Step 6: Run AgentTrigger tests**

Run:
```bash
npm run test -w client -- client/src/app/components/AgentTrigger/AgentTrigger.test.tsx
```

Expected: All 3 tests PASS.

- [ ] **Step 7: Run full test suite**

Run:
```bash
npm run test
```

Expected: All tests pass — no regressions from header changes.

- [ ] **Step 8: Commit**

```bash
git add client/src/app/components/AgentTrigger/ client/src/app/layout/header.tsx
git commit -m "feat(agent): add AgentTrigger with popover to masthead header"
```

---

### Task 8: Visual Verification + Final Cleanup

**Files:**
- No new files — verification and polish only

**Interfaces:**
- Consumes: All prior tasks

- [ ] **Step 1: Start dev server with mock data**

Run:
```bash
MOCK=on npm run start:dev
```

Expected: Dev server starts without errors.

- [ ] **Step 2: Verify Agent page renders**

Navigate to `http://localhost:9000/agent` in the browser. Verify:
- Page heading "Agent" is visible
- 8 insight cards render with correct severity colors (2 red, 4 orange, 2 blue)
- Summary bar shows "2 Critical · 4 Warnings · 2 Info"
- Chat panel appears below with suggested prompt chips
- "New conversation" button in chat header

- [ ] **Step 3: Verify insight card click interaction**

Click an insight card (e.g., "TUF root metadata expires in 12 days"). Verify:
- The chat input receives the suggested prompt
- A user message appears in the chat timeline
- An agent response streams in with markdown formatting

- [ ] **Step 4: Verify chat functionality**

Type a message like "Show me the unacknowledged alerts" and press Enter. Verify:
- User message appears right-aligned
- Agent response appears left-aligned with robot icon
- Response contains a markdown table of alerts
- Streaming animation is visible (text appears progressively)

- [ ] **Step 5: Verify localStorage persistence**

Navigate away from `/agent` (e.g., to `/dashboard`), then navigate back. Verify:
- Previous conversation messages are restored
- Click "New conversation" → messages clear

- [ ] **Step 6: Verify AgentTrigger in masthead**

On any page, verify:
- Robot icon with badge "8" appears between the notification bell and dark mode toggle
- Clicking it opens a popover with top 3 insights
- "View all insights" link navigates to `/agent`
- Typing in the quick prompt input and pressing Enter navigates to `/agent?prompt=...`

- [ ] **Step 7: Verify sidebar navigation**

Verify:
- "Agent" appears as the second sidebar item (after "System Health")
- "New" badge is visible next to the label
- Clicking navigates to `/agent`

- [ ] **Step 8: Run lint and full test suite**

Run:
```bash
npm run lint && npm run test
```

Expected: Both pass with no errors.

- [ ] **Step 9: Final commit if any cleanup was needed**

If any visual or functional issues were found and fixed during verification:

```bash
git add -A
git commit -m "fix(agent): visual polish and bug fixes"
```
