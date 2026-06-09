# AI-Assisted Policy Generator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an AI-assisted Conforma policy generation page to the RHTAS Console that lets users describe security requirements in natural language and receive complete, tested Rego v1 policies — with no Rego knowledge required.

**Architecture:** Chat-primary UI with fixed split panel (conversation left, tabbed artifact viewer right). The frontend calls `POST /api/v1/policies/generate` and `POST /api/v1/policies/validate` via the existing Express proxy. Session state lives in localStorage. Development proceeds mock-first with `MOCK=on`, then integrates with the real AI microservice.

**Tech Stack:** React 18, PatternFly v6, React Query v5, React Router v7, react-syntax-highlighter (Prism), Vitest, `@hey-api/openapi-ts` for SDK generation.

---

## File Structure

| File | Responsibility |
|---|---|
| **Create:** `client/src/app/pages/PolicyGenerator/PolicyGenerator.tsx` | Page container — manages session state, orchestrates chat↔artifact flow |
| **Create:** `client/src/app/pages/PolicyGenerator/index.ts` | Default export barrel |
| **Create:** `client/src/app/pages/PolicyGenerator/types.ts` | All TypeScript interfaces: `PolicySession`, `ChatMessage`, `PolicyArtifacts`, `ArtifactFile`, `TestResults`, `VerificationContext` |
| **Create:** `client/src/app/pages/PolicyGenerator/usePolicySession.ts` | Custom hook — localStorage persistence, session CRUD, message append |
| **Create:** `client/src/app/pages/PolicyGenerator/components/ChatPanel.tsx` | Left split — message list + input, calls generate mutation |
| **Create:** `client/src/app/pages/PolicyGenerator/components/ChatMessage.tsx` | Single message bubble — user right-aligned, assistant left-aligned, optional artifact summary card |
| **Create:** `client/src/app/pages/PolicyGenerator/components/ChatInput.tsx` | Text input, policy type chips, optional verification credential fields, send button |
| **Create:** `client/src/app/pages/PolicyGenerator/components/ArtifactPanel.tsx` | Right split — tabbed artifact viewer with version selector |
| **Create:** `client/src/app/pages/PolicyGenerator/components/ArtifactCodeView.tsx` | Syntax-highlighted code display (Prism) |
| **Create:** `client/src/app/pages/PolicyGenerator/components/TestResultsBadge.tsx` | OPA test pass/fail count, "Run tests" button |
| **Create:** `client/src/app/pages/PolicyGenerator/components/ArtifactActions.tsx` | Download zip, copy to clipboard |
| **Create:** `client/src/app/queries/policies.ts` | React Query mutations: `usePolicyGenerate`, `usePolicyValidate` with mock support |
| **Create:** `client/src/app/queries/mocks/policies.mock.ts` | Multi-turn mock conversation with realistic Rego v1 artifacts |
| **Modify:** `client/src/app/Routes.tsx` | Add `policyGenerator` path + lazy import |
| **Modify:** `client/src/app/layout/sidebar.tsx` | Add "Policy Generator" nav link |
| **Modify:** `client/openapi/console.yaml` | Add `Policies` tag + two endpoint schemas |
| **Create:** `client/src/app/pages/PolicyGenerator/PolicyGenerator.test.tsx` | Page-level integration tests |
| **Create:** `client/src/app/pages/PolicyGenerator/usePolicySession.test.ts` | Hook unit tests |
| **Create:** `client/src/app/queries/policies.test.ts` | Mutation hook tests |
| **Create:** `client/src/app/pages/PolicyGenerator/components/ChatMessage.test.tsx` | ChatMessage render tests |
| **Create:** `client/src/app/pages/PolicyGenerator/components/ArtifactPanel.test.tsx` | ArtifactPanel render tests |

---

## Task 1: Types and Interfaces

**Files:**
- Create: `client/src/app/pages/PolicyGenerator/types.ts`

- [ ] **Step 1: Write the types file**

```typescript
// client/src/app/pages/PolicyGenerator/types.ts

export type PolicyType = "both" | "slsa" | "sbom";

export interface ArtifactFile {
  filename: string;
  content: string;
}

export interface TestResults {
  passed: number;
  failed: number;
  results: Array<{ name: string; status: "pass" | "fail" }>;
}

export interface PolicyArtifacts {
  rule: ArtifactFile;
  tests: ArtifactFile;
  config: ArtifactFile;
  data?: ArtifactFile;
  command: string;
  version: number;
  testResults?: TestResults;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  artifacts?: PolicyArtifacts;
  timestamp: string;
}

export interface PolicySession {
  id: string;
  messages: ChatMessage[];
  currentArtifacts: PolicyArtifacts | null;
  artifactHistory: PolicyArtifacts[];
  policyTypeFilter: PolicyType;
  createdAt: string;
  title: string;
}

export interface SessionSummary {
  id: string;
  title: string;
  createdAt: string;
  messageCount: number;
}

export type VerificationContext =
  | { type: "public-key"; publicKey: string }
  | { type: "keyless"; oidcIssuer: string; identity: string };

export interface GenerateRequest {
  sessionId: string;
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  context?: {
    imageRef?: string;
    policyTypes?: PolicyType[];
    sbomFormat?: "spdx" | "cyclonedx" | "both";
    verification?: VerificationContext;
  };
}

export interface GenerateResponse {
  sessionId: string;
  reply: string;
  artifacts: {
    rule: ArtifactFile;
    tests: ArtifactFile;
    config: ArtifactFile;
    data?: ArtifactFile;
    command: string;
  } | null;
  policyMeta?: {
    types: string[];
    version: number;
  };
}

export interface ValidateRequest {
  rule: string;
  tests: string;
}

export interface ValidateResponse {
  passed: number;
  failed: number;
  results: Array<{ name: string; status: "pass" | "fail" }>;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx -w client tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `types.ts`

- [ ] **Step 3: Commit**

```bash
git add client/src/app/pages/PolicyGenerator/types.ts
git commit -m "feat(policy-generator): add TypeScript interfaces for policy generation"
```

---

## Task 2: Mock Data

**Files:**
- Create: `client/src/app/queries/mocks/policies.mock.ts`

- [ ] **Step 1: Write the mock data file**

```typescript
// client/src/app/queries/mocks/policies.mock.ts

import type {
  ChatMessage,
  PolicyArtifacts,
  PolicySession,
  GenerateResponse,
  ValidateResponse,
} from "@app/pages/PolicyGenerator/types";

const slsaRuleV1 = `package policy.slsa_provenance

import rego.v1

allowed_builders := data.allowed_builders
allowed_source_pattern := data.allowed_source_pattern

# title: Verify builder identity
# description: Ensure the build was performed by an authorized builder
deny contains msg if {
  some att in input.attestations
  att.statement.predicateType == "https://slsa.dev/provenance/v1"
  prov := att.statement.predicate
  not prov.runDetails.builder.id in allowed_builders
  msg := sprintf("builder %s is not in allowed list", [prov.runDetails.builder.id])
}

# title: Verify source repository
# description: Ensure source material comes from authorized repositories
deny contains msg if {
  some att in input.attestations
  att.statement.predicateType == "https://slsa.dev/provenance/v1"
  prov := att.statement.predicate
  some dep in prov.buildDefinition.resolvedDependencies
  not regex.match(allowed_source_pattern, dep.uri)
  msg := sprintf("source %s does not match allowed pattern", [dep.uri])
}

# title: Enforce hermetic builds
# description: Require hermetic build execution
deny contains msg if {
  some att in input.attestations
  att.statement.predicateType == "https://slsa.dev/provenance/v1"
  prov := att.statement.predicate
  not prov.buildDefinition.internalParameters.hermetic == true
  msg := "build is not hermetic"
}`;

const slsaTestV1 = `package policy.slsa_provenance_test

import rego.v1
import data.policy.slsa_provenance

mock_valid_provenance := {"attestations": [{
  "statement": {
    "predicateType": "https://slsa.dev/provenance/v1",
    "predicate": {
      "runDetails": {"builder": {"id": "https://tekton.myorg.com/chains/v2"}},
      "buildDefinition": {
        "resolvedDependencies": [{"uri": "github.com/myorg/api-server"}],
        "internalParameters": {"hermetic": true},
      },
    },
  },
}]}

mock_invalid_builder := {"attestations": [{
  "statement": {
    "predicateType": "https://slsa.dev/provenance/v1",
    "predicate": {
      "runDetails": {"builder": {"id": "https://evil.com/builder"}},
      "buildDefinition": {
        "resolvedDependencies": [{"uri": "github.com/myorg/api-server"}],
        "internalParameters": {"hermetic": true},
      },
    },
  },
}]}

test_valid_provenance_allowed if {
  count(slsa_provenance.deny) == 0 with input as mock_valid_provenance
    with data.allowed_builders as ["https://tekton.myorg.com/chains/v2"]
    with data.allowed_source_pattern as "^github\\\\.com/myorg/.*$"
}

test_invalid_builder_denied if {
  count(slsa_provenance.deny) > 0 with input as mock_invalid_builder
    with data.allowed_builders as ["https://tekton.myorg.com/chains/v2"]
    with data.allowed_source_pattern as "^github\\\\.com/myorg/.*$"
}`;

const slsaConfigV1 = `sources:
  - policy:
      - github.com/myorg/conforma-policies
    data:
      - oci::quay.io/myorg/policy-data:latest
    config:
      include:
        - "slsa_provenance"`;

const slsaDataV1 = `{
  "allowed_builders": [
    "https://tekton.myorg.com/chains/v2"
  ],
  "allowed_source_pattern": "^github\\\\.com/myorg/.*$"
}`;

const slsaCommandV1 =
  "ec validate image --image quay.io/myorg/api-server:v2.1 --policy policy.yaml --public-key cosign.pub";

const artifactsV1: PolicyArtifacts = {
  rule: { filename: "policy.rego", content: slsaRuleV1 },
  tests: { filename: "policy_test.rego", content: slsaTestV1 },
  config: { filename: "policy.yaml", content: slsaConfigV1 },
  data: { filename: "allowed_sources.json", content: slsaDataV1 },
  command: slsaCommandV1,
  version: 1,
  testResults: {
    passed: 2,
    failed: 0,
    results: [
      { name: "test_valid_provenance_allowed", status: "pass" },
      { name: "test_invalid_builder_denied", status: "pass" },
    ],
  },
};

export const mockMessages: ChatMessage[] = [
  {
    id: "msg-1",
    role: "assistant",
    content:
      "Welcome! I can generate Conforma policies from natural language. Tell me:\n\n- What security requirements do you need to enforce?\n- Optionally: the container image reference and signing identity\n\nI support SBOM composition policies and SLSA build provenance policies.",
    timestamp: "2026-06-08T10:00:00Z",
  },
  {
    id: "msg-2",
    role: "user",
    content:
      "I need to ensure all container images in production are built by our Tekton pipeline (builder ID: https://tekton.myorg.com/chains/v2) from the main branch of github.com/myorg/* repos, with hermetic builds enforced. Image: quay.io/myorg/api-server:v2.1",
    timestamp: "2026-06-08T10:00:30Z",
  },
  {
    id: "msg-3",
    role: "assistant",
    content:
      "I've generated a SLSA Build L3 provenance policy with 3 rules:\n\n**1. Builder Identity** — Pins to your Tekton Chains v2 builder\n**2. Source Verification** — Validates source from github.com/myorg/* repositories\n**3. Hermetic Build** — Enforces hermetic build execution\n\nAll 2 OPA tests are passing. View the artifacts in the panel to review the generated Rego code, tests, and deployment configuration.",
    artifacts: artifactsV1,
    timestamp: "2026-06-08T10:01:00Z",
  },
];

export const mockSession: PolicySession = {
  id: "session-mock-1",
  messages: mockMessages,
  currentArtifacts: artifactsV1,
  artifactHistory: [],
  policyTypeFilter: "both",
  createdAt: "2026-06-08T10:00:00Z",
  title: "SLSA Provenance Policy",
};

export const mockGenerateResponse: GenerateResponse = {
  sessionId: "session-mock-1",
  reply: mockMessages[2].content,
  artifacts: {
    rule: artifactsV1.rule,
    tests: artifactsV1.tests,
    config: artifactsV1.config,
    data: artifactsV1.data,
    command: artifactsV1.command,
  },
  policyMeta: {
    types: ["slsa-provenance"],
    version: 1,
  },
};

export const mockValidateResponse: ValidateResponse = {
  passed: 2,
  failed: 0,
  results: [
    { name: "test_valid_provenance_allowed", status: "pass" },
    { name: "test_invalid_builder_denied", status: "pass" },
  ],
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx -w client tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `policies.mock.ts`

- [ ] **Step 3: Commit**

```bash
git add client/src/app/queries/mocks/policies.mock.ts
git commit -m "feat(policy-generator): add mock data with realistic Rego v1 policy artifacts"
```

---

## Task 3: Query Mutations

**Files:**
- Create: `client/src/app/queries/policies.ts`
- Create: `client/src/app/queries/policies.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// client/src/app/queries/policies.test.ts

import { describe, expect, test, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type React from "react";

vi.mock("@app/env", () => ({
  default: { MOCK: "on" },
}));

vi.mock("@app/axios-config/apiInit", () => ({
  client: {},
}));

import { usePolicyGenerate, usePolicyValidate } from "./policies";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("usePolicyGenerate", () => {
  test("returns mock response in MOCK=on mode", async () => {
    const { result } = renderHook(() => usePolicyGenerate(), {
      wrapper: createWrapper(),
    });

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
    const { result } = renderHook(() => usePolicyValidate(), {
      wrapper: createWrapper(),
    });

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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -w client -- client/src/app/queries/policies.test.ts 2>&1 | tail -20`
Expected: FAIL — module `./policies` not found

- [ ] **Step 3: Write the mutations implementation**

```typescript
// client/src/app/queries/policies.ts

import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import ENV from "@app/env";
import { client } from "@app/axios-config/apiInit";
import type {
  GenerateRequest,
  GenerateResponse,
  ValidateRequest,
  ValidateResponse,
} from "@app/pages/PolicyGenerator/types";
import { mockGenerateResponse, mockValidateResponse } from "./mocks/policies.mock";

const mockDelay = <T>(data: T, ms = 1500): Promise<T> =>
  new Promise((resolve) => setTimeout(resolve, ms, data));

export const usePolicyGenerate = () => {
  const mutation = useMutation<GenerateResponse, AxiosError, GenerateRequest>({
    mutationFn: async (request: GenerateRequest) => {
      if (ENV.MOCK !== "off") {
        return mockDelay(mockGenerateResponse);
      }
      const response = await client.post<GenerateResponse>(
        "/api/v1/policies/generate",
        request,
      );
      return response.data;
    },
  });

  return {
    generate: (request: GenerateRequest) => mutation.mutateAsync(request),
    isGenerating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

export const usePolicyValidate = () => {
  const mutation = useMutation<ValidateResponse, AxiosError, ValidateRequest>({
    mutationFn: async (request: ValidateRequest) => {
      if (ENV.MOCK !== "off") {
        return mockDelay(mockValidateResponse, 800);
      }
      const response = await client.post<ValidateResponse>(
        "/api/v1/policies/validate",
        request,
      );
      return response.data;
    },
  });

  return {
    validate: (request: ValidateRequest) => mutation.mutateAsync(request),
    isValidating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -w client -- client/src/app/queries/policies.test.ts 2>&1 | tail -20`
Expected: PASS — 2 tests passing

- [ ] **Step 5: Commit**

```bash
git add client/src/app/queries/policies.ts client/src/app/queries/policies.test.ts
git commit -m "feat(policy-generator): add generate and validate mutation hooks with mock support"
```

---

## Task 4: Session Hook (usePolicySession)

**Files:**
- Create: `client/src/app/pages/PolicyGenerator/usePolicySession.ts`
- Create: `client/src/app/pages/PolicyGenerator/usePolicySession.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// client/src/app/pages/PolicyGenerator/usePolicySession.test.ts

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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -w client -- client/src/app/pages/PolicyGenerator/usePolicySession.test.ts 2>&1 | tail -20`
Expected: FAIL — module `./usePolicySession` not found

- [ ] **Step 3: Write the session hook implementation**

```typescript
// client/src/app/pages/PolicyGenerator/usePolicySession.ts

import { useState, useCallback, useEffect } from "react";
import type {
  PolicySession,
  ChatMessage,
  PolicyArtifacts,
  PolicyType,
  SessionSummary,
} from "./types";

export const STORAGE_KEY = "rhtas-policy-sessions";

const generateId = (): string =>
  `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const createEmptySession = (): PolicySession => ({
  id: generateId(),
  messages: [],
  currentArtifacts: null,
  artifactHistory: [],
  policyTypeFilter: "both",
  createdAt: new Date().toISOString(),
  title: "New Policy Session",
});

const loadSessions = (): PolicySession[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PolicySession[];
  } catch {
    console.error("Failed to parse policy sessions from localStorage, starting fresh");
    return [];
  }
};

const saveSessions = (sessions: PolicySession[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error("Failed to save policy sessions to localStorage:", e);
  }
};

export const usePolicySession = () => {
  const [allSessions, setAllSessions] = useState<PolicySession[]>(() => {
    const existing = loadSessions();
    if (existing.length > 0) return existing;
    return [createEmptySession()];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(
    () => allSessions[allSessions.length - 1].id,
  );

  const session = allSessions.find((s) => s.id === activeSessionId) ?? allSessions[allSessions.length - 1];

  useEffect(() => {
    saveSessions(allSessions);
  }, [allSessions]);

  const updateSession = useCallback(
    (updater: (s: PolicySession) => PolicySession) => {
      setAllSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? updater(s) : s)),
      );
    },
    [activeSessionId],
  );

  const appendMessage = useCallback(
    (message: ChatMessage) => {
      updateSession((s) => ({
        ...s,
        messages: [...s.messages, message],
        title:
          s.messages.length === 0 && message.role === "user"
            ? message.content.slice(0, 60)
            : s.title,
      }));
    },
    [updateSession],
  );

  const setArtifacts = useCallback(
    (artifacts: PolicyArtifacts) => {
      updateSession((s) => ({
        ...s,
        artifactHistory: s.currentArtifacts
          ? [...s.artifactHistory, s.currentArtifacts]
          : s.artifactHistory,
        currentArtifacts: artifacts,
      }));
    },
    [updateSession],
  );

  const setPolicyTypeFilter = useCallback(
    (filter: PolicyType) => {
      updateSession((s) => ({ ...s, policyTypeFilter: filter }));
    },
    [updateSession],
  );

  const newSession = useCallback(() => {
    const fresh = createEmptySession();
    setAllSessions((prev) => [...prev, fresh]);
    setActiveSessionId(fresh.id);
  }, []);

  const loadSession = useCallback((id: string) => {
    setActiveSessionId(id);
  }, []);

  const sessions: SessionSummary[] = allSessions.map((s) => ({
    id: s.id,
    title: s.title,
    createdAt: s.createdAt,
    messageCount: s.messages.length,
  }));

  return {
    session,
    sessions,
    appendMessage,
    setArtifacts,
    setPolicyTypeFilter,
    newSession,
    loadSession,
  };
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -w client -- client/src/app/pages/PolicyGenerator/usePolicySession.test.ts 2>&1 | tail -20`
Expected: PASS — 5 tests passing

- [ ] **Step 5: Commit**

```bash
git add client/src/app/pages/PolicyGenerator/usePolicySession.ts client/src/app/pages/PolicyGenerator/usePolicySession.test.ts
git commit -m "feat(policy-generator): add usePolicySession hook with localStorage persistence"
```

---

## Task 5: ChatMessage Component

**Files:**
- Create: `client/src/app/pages/PolicyGenerator/components/ChatMessage.tsx`
- Create: `client/src/app/pages/PolicyGenerator/components/ChatMessage.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// client/src/app/pages/PolicyGenerator/components/ChatMessage.test.tsx

import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatMessage } from "./ChatMessage";
import type { ChatMessage as ChatMessageType } from "../types";

describe("ChatMessage", () => {
  const userMessage: ChatMessageType = {
    id: "msg-1",
    role: "user",
    content: "Generate a SLSA policy",
    timestamp: "2026-06-08T10:00:00Z",
  };

  const assistantMessage: ChatMessageType = {
    id: "msg-2",
    role: "assistant",
    content: "I've generated a SLSA provenance policy with 3 rules.",
    timestamp: "2026-06-08T10:01:00Z",
  };

  const assistantWithArtifacts: ChatMessageType = {
    id: "msg-3",
    role: "assistant",
    content: "Here is your policy.",
    artifacts: {
      rule: { filename: "policy.rego", content: "package test" },
      tests: { filename: "policy_test.rego", content: "package test_test" },
      config: { filename: "policy.yaml", content: "sources: []" },
      command: "ec validate image",
      version: 1,
      testResults: { passed: 2, failed: 0, results: [] },
    },
    timestamp: "2026-06-08T10:02:00Z",
  };

  test("renders user message content", () => {
    render(<ChatMessage message={userMessage} />);
    expect(screen.getByText("Generate a SLSA policy")).toBeInTheDocument();
  });

  test("renders assistant message content", () => {
    render(<ChatMessage message={assistantMessage} />);
    expect(screen.getByText(/I've generated a SLSA provenance policy/)).toBeInTheDocument();
  });

  test("shows artifact summary card when artifacts are present", () => {
    render(<ChatMessage message={assistantWithArtifacts} />);
    expect(screen.getByText(/2 tests passing/i)).toBeInTheDocument();
  });

  test("does not show artifact card for messages without artifacts", () => {
    render(<ChatMessage message={assistantMessage} />);
    expect(screen.queryByText(/tests passing/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -w client -- client/src/app/pages/PolicyGenerator/components/ChatMessage.test.tsx 2>&1 | tail -20`
Expected: FAIL — module `./ChatMessage` not found

- [ ] **Step 3: Write the ChatMessage component**

```tsx
// client/src/app/pages/PolicyGenerator/components/ChatMessage.tsx

import type React from "react";
import { Card, CardBody, Icon, Label } from "@patternfly/react-core";
import { CheckCircleIcon, TimesCircleIcon } from "@patternfly/react-icons";
import type { ChatMessage as ChatMessageType } from "../types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "var(--pf-t--global--spacer--sm)",
      }}
    >
      <div
        style={{
          maxWidth: "80%",
          padding: "var(--pf-t--global--spacer--sm) var(--pf-t--global--spacer--md)",
          borderRadius: "var(--pf-t--global--border--radius--medium)",
          backgroundColor: isUser
            ? "var(--pf-t--global--background--color--primary--default)"
            : "var(--pf-t--global--background--color--secondary--default)",
          color: isUser
            ? "var(--pf-t--global--text--color--on-brand--default)"
            : "var(--pf-t--global--text--color--regular)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
        data-testid={`chat-message-${message.id}`}
      >
        {message.content}
        {message.artifacts && <ArtifactSummaryCard artifacts={message.artifacts} />}
      </div>
    </div>
  );
};

const ArtifactSummaryCard: React.FC<{
  artifacts: NonNullable<ChatMessageType["artifacts"]>;
}> = ({ artifacts }) => {
  const testResults = artifacts.testResults;
  const allPassing = testResults && testResults.failed === 0;

  return (
    <Card isCompact style={{ marginTop: "var(--pf-t--global--spacer--sm)" }}>
      <CardBody>
        {testResults && (
          <Label
            color={allPassing ? "green" : "red"}
            icon={
              <Icon>
                {allPassing ? <CheckCircleIcon /> : <TimesCircleIcon />}
              </Icon>
            }
          >
            {testResults.passed} tests passing
            {testResults.failed > 0 && `, ${testResults.failed} failing`}
          </Label>
        )}
        <div style={{ fontSize: "var(--pf-t--global--font--size--xs)", marginTop: "var(--pf-t--global--spacer--xs)", color: "var(--pf-t--global--text--color--subtle)" }}>
          v{artifacts.version} — View artifacts in panel
        </div>
      </CardBody>
    </Card>
  );
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -w client -- client/src/app/pages/PolicyGenerator/components/ChatMessage.test.tsx 2>&1 | tail -20`
Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add client/src/app/pages/PolicyGenerator/components/ChatMessage.tsx client/src/app/pages/PolicyGenerator/components/ChatMessage.test.tsx
git commit -m "feat(policy-generator): add ChatMessage component with artifact summary card"
```

---

## Task 6: ChatInput Component

**Files:**
- Create: `client/src/app/pages/PolicyGenerator/components/ChatInput.tsx`

- [ ] **Step 1: Write the ChatInput component**

```tsx
// client/src/app/pages/PolicyGenerator/components/ChatInput.tsx

import type React from "react";
import { useState } from "react";
import {
  Button,
  TextArea,
  Chip,
  ChipGroup,
  ExpandableSection,
  FormGroup,
  TextInput,
} from "@patternfly/react-core";
import { PaperPlaneIcon } from "@patternfly/react-icons";
import type { PolicyType, VerificationContext } from "../types";

interface ChatInputProps {
  onSend: (
    message: string,
    options: {
      imageRef?: string;
      verification?: VerificationContext;
    },
  ) => void;
  isDisabled: boolean;
  policyTypeFilter: PolicyType;
  onPolicyTypeChange: (type: PolicyType) => void;
}

const POLICY_TYPE_OPTIONS: Array<{ value: PolicyType; label: string }> = [
  { value: "both", label: "SBOM + SLSA" },
  { value: "slsa", label: "SLSA only" },
  { value: "sbom", label: "SBOM only" },
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isDisabled,
  policyTypeFilter,
  onPolicyTypeChange,
}) => {
  const [message, setMessage] = useState("");
  const [imageRef, setImageRef] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const verification: VerificationContext | undefined = publicKey.trim()
      ? { type: "public-key", publicKey: publicKey.trim() }
      : undefined;

    onSend(trimmed, {
      imageRef: imageRef.trim() || undefined,
      verification,
    });

    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        padding: "var(--pf-t--global--spacer--md)",
        borderTop: "1px solid var(--pf-t--global--border--color--default)",
        backgroundColor: "var(--pf-t--global--background--color--primary--default)",
      }}
    >
      <ChipGroup categoryName="Policy type">
        {POLICY_TYPE_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            onClick={() => onPolicyTypeChange(opt.value)}
            isReadOnly={policyTypeFilter === opt.value}
            badge={policyTypeFilter === opt.value ? undefined : undefined}
            style={{
              cursor: "pointer",
              fontWeight: policyTypeFilter === opt.value ? "bold" : "normal",
            }}
          >
            {opt.label}
          </Chip>
        ))}
      </ChipGroup>

      <ExpandableSection
        toggleText={showAdvanced ? "Hide options" : "Image & credentials"}
        isExpanded={showAdvanced}
        onToggle={(_event, expanded) => setShowAdvanced(expanded)}
        style={{ marginTop: "var(--pf-t--global--spacer--sm)" }}
      >
        <FormGroup label="Image reference" fieldId="image-ref">
          <TextInput
            id="image-ref"
            value={imageRef}
            onChange={(_event, val) => setImageRef(val)}
            placeholder="quay.io/myorg/myapp:latest"
          />
        </FormGroup>
        <FormGroup
          label="Cosign public key (PEM)"
          fieldId="public-key"
          style={{ marginTop: "var(--pf-t--global--spacer--sm)" }}
        >
          <TextArea
            id="public-key"
            value={publicKey}
            onChange={(_event, val) => setPublicKey(val)}
            placeholder="-----BEGIN PUBLIC KEY-----"
            rows={3}
          />
        </FormGroup>
      </ExpandableSection>

      <div
        style={{
          display: "flex",
          gap: "var(--pf-t--global--spacer--sm)",
          marginTop: "var(--pf-t--global--spacer--sm)",
        }}
      >
        <TextArea
          value={message}
          onChange={(_event, val) => setMessage(val)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your policy requirements..."
          aria-label="Policy message input"
          isDisabled={isDisabled}
          rows={2}
          resizeOrientation="vertical"
          style={{ flex: 1 }}
        />
        <Button
          variant="primary"
          onClick={handleSend}
          isDisabled={isDisabled || !message.trim()}
          icon={<PaperPlaneIcon />}
          aria-label="Send message"
        >
          Send
        </Button>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx -w client tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `ChatInput.tsx`

- [ ] **Step 3: Commit**

```bash
git add client/src/app/pages/PolicyGenerator/components/ChatInput.tsx
git commit -m "feat(policy-generator): add ChatInput with policy type chips and verification fields"
```

---

## Task 7: ChatPanel Component

**Files:**
- Create: `client/src/app/pages/PolicyGenerator/components/ChatPanel.tsx`

- [ ] **Step 1: Write the ChatPanel component**

```tsx
// client/src/app/pages/PolicyGenerator/components/ChatPanel.tsx

import type React from "react";
import { useEffect, useRef } from "react";
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  Spinner,
} from "@patternfly/react-core";
import type { ChatMessage as ChatMessageType, PolicyType, VerificationContext } from "../types";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

interface ChatPanelProps {
  messages: ChatMessageType[];
  isGenerating: boolean;
  policyTypeFilter: PolicyType;
  onPolicyTypeChange: (type: PolicyType) => void;
  onSendMessage: (
    message: string,
    options: {
      imageRef?: string;
      verification?: VerificationContext;
    },
  ) => void;
  error?: string | null;
  onRetry?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isGenerating,
  policyTypeFilter,
  onPolicyTypeChange,
  onSendMessage,
  error,
  onRetry,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isGenerating]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minWidth: 0,
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "var(--pf-t--global--spacer--md)",
        }}
      >
        {messages.length === 0 && !isGenerating && (
          <Bullseye>
            <EmptyState>
              <EmptyStateBody>
                Describe your supply chain security requirements and I'll generate
                a Conforma policy. Supports SBOM composition and SLSA build
                provenance.
              </EmptyStateBody>
            </EmptyState>
          </Bullseye>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isGenerating && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              marginBottom: "var(--pf-t--global--spacer--sm)",
            }}
          >
            <div
              style={{
                padding: "var(--pf-t--global--spacer--sm) var(--pf-t--global--spacer--md)",
                borderRadius: "var(--pf-t--global--border--radius--medium)",
                backgroundColor: "var(--pf-t--global--background--color--secondary--default)",
              }}
            >
              <Spinner size="md" aria-label="Generating policy" />{" "}
              Generating...
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              marginBottom: "var(--pf-t--global--spacer--sm)",
            }}
          >
            <div
              style={{
                padding: "var(--pf-t--global--spacer--sm) var(--pf-t--global--spacer--md)",
                borderRadius: "var(--pf-t--global--border--radius--medium)",
                backgroundColor: "var(--pf-t--global--color--red--100)",
                color: "var(--pf-t--global--color--red--300)",
              }}
            >
              {error}
              {onRetry && (
                <button
                  onClick={onRetry}
                  style={{
                    marginLeft: "var(--pf-t--global--spacer--sm)",
                    textDecoration: "underline",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    color: "inherit",
                  }}
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSend={onSendMessage}
        isDisabled={isGenerating}
        policyTypeFilter={policyTypeFilter}
        onPolicyTypeChange={onPolicyTypeChange}
      />
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx -w client tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add client/src/app/pages/PolicyGenerator/components/ChatPanel.tsx
git commit -m "feat(policy-generator): add ChatPanel with message list, auto-scroll, and error display"
```

---

## Task 8: ArtifactCodeView Component

**Files:**
- Create: `client/src/app/pages/PolicyGenerator/components/ArtifactCodeView.tsx`

- [ ] **Step 1: Write the ArtifactCodeView component**

```tsx
// client/src/app/pages/PolicyGenerator/components/ArtifactCodeView.tsx

import type React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

interface ArtifactCodeViewProps {
  content: string;
  filename: string;
}

const getLanguage = (filename: string): string => {
  if (filename.endsWith(".rego")) return "go";
  if (filename.endsWith(".yaml") || filename.endsWith(".yml")) return "yaml";
  if (filename.endsWith(".json")) return "json";
  return "bash";
};

export const ArtifactCodeView: React.FC<ArtifactCodeViewProps> = ({
  content,
  filename,
}) => {
  return (
    <div style={{ flex: 1, overflow: "auto" }} data-testid="artifact-code-view">
      <SyntaxHighlighter
        language={getLanguage(filename)}
        style={atomDark}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          height: "100%",
          fontSize: "var(--pf-t--global--font--size--sm)",
        }}
        showLineNumbers
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx -w client tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add client/src/app/pages/PolicyGenerator/components/ArtifactCodeView.tsx
git commit -m "feat(policy-generator): add ArtifactCodeView with Prism syntax highlighting"
```

---

## Task 9: TestResultsBadge Component

**Files:**
- Create: `client/src/app/pages/PolicyGenerator/components/TestResultsBadge.tsx`

- [ ] **Step 1: Write the TestResultsBadge component**

```tsx
// client/src/app/pages/PolicyGenerator/components/TestResultsBadge.tsx

import type React from "react";
import { Button, Icon, Label, Split, SplitItem } from "@patternfly/react-core";
import {
  CheckCircleIcon,
  TimesCircleIcon,
  SyncAltIcon,
  ExclamationTriangleIcon,
} from "@patternfly/react-icons";
import type { TestResults } from "../types";

interface TestResultsBadgeProps {
  testResults?: TestResults;
  isValidating: boolean;
  onRunTests: () => void;
  validationError?: string | null;
}

export const TestResultsBadge: React.FC<TestResultsBadgeProps> = ({
  testResults,
  isValidating,
  onRunTests,
  validationError,
}) => {
  return (
    <div
      style={{
        padding: "var(--pf-t--global--spacer--sm) var(--pf-t--global--spacer--md)",
        borderTop: "1px solid var(--pf-t--global--border--color--default)",
        borderBottom: "1px solid var(--pf-t--global--border--color--default)",
      }}
    >
      <Split hasGutter>
        <SplitItem isFilled>
          {validationError ? (
            <Label
              color="orange"
              icon={
                <Icon>
                  <ExclamationTriangleIcon />
                </Icon>
              }
            >
              Validation unavailable
            </Label>
          ) : testResults ? (
            <Label
              color={testResults.failed === 0 ? "green" : "red"}
              icon={
                <Icon>
                  {testResults.failed === 0 ? (
                    <CheckCircleIcon />
                  ) : (
                    <TimesCircleIcon />
                  )}
                </Icon>
              }
            >
              {testResults.passed}/{testResults.passed + testResults.failed} tests passing
            </Label>
          ) : (
            <Label color="grey">No test results</Label>
          )}
        </SplitItem>
        <SplitItem>
          <Button
            variant="link"
            onClick={onRunTests}
            isDisabled={isValidating}
            isLoading={isValidating}
            icon={<SyncAltIcon />}
            size="sm"
          >
            Run tests
          </Button>
        </SplitItem>
      </Split>
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx -w client tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add client/src/app/pages/PolicyGenerator/components/TestResultsBadge.tsx
git commit -m "feat(policy-generator): add TestResultsBadge with pass/fail display and run button"
```

---

## Task 10: ArtifactActions Component

**Files:**
- Create: `client/src/app/pages/PolicyGenerator/components/ArtifactActions.tsx`

- [ ] **Step 1: Write the ArtifactActions component**

```tsx
// client/src/app/pages/PolicyGenerator/components/ArtifactActions.tsx

import type React from "react";
import { useState } from "react";
import { Button, Split, SplitItem, Tooltip } from "@patternfly/react-core";
import { DownloadIcon, CopyIcon, CheckIcon } from "@patternfly/react-icons";
import type { PolicyArtifacts } from "../types";

interface ArtifactActionsProps {
  artifacts: PolicyArtifacts;
  activeTabContent: string;
}

const downloadAsZip = async (artifacts: PolicyArtifacts): Promise<void> => {
  const files: Array<{ name: string; content: string }> = [
    { name: artifacts.rule.filename, content: artifacts.rule.content },
    { name: artifacts.tests.filename, content: artifacts.tests.content },
    { name: artifacts.config.filename, content: artifacts.config.content },
  ];

  if (artifacts.data) {
    files.push({ name: artifacts.data.filename, content: artifacts.data.content });
  }

  files.push({ name: "validate.sh", content: `#!/bin/bash\n${artifacts.command}\n` });

  // Build a simple concatenated download of individual files
  // since we don't want to add a jszip dependency for MVP
  for (const file of files) {
    const blob = new Blob([file.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = file.name;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
};

export const ArtifactActions: React.FC<ArtifactActionsProps> = ({
  artifacts,
  activeTabContent,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(activeTabContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        padding: "var(--pf-t--global--spacer--sm) var(--pf-t--global--spacer--md)",
      }}
    >
      <Split hasGutter>
        <SplitItem isFilled>
          <Button
            variant="primary"
            icon={<DownloadIcon />}
            onClick={() => downloadAsZip(artifacts)}
          >
            Download All Files
          </Button>
        </SplitItem>
        <SplitItem>
          <Tooltip content={copied ? "Copied!" : "Copy to clipboard"}>
            <Button
              variant="secondary"
              icon={copied ? <CheckIcon /> : <CopyIcon />}
              onClick={handleCopy}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </Tooltip>
        </SplitItem>
      </Split>
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx -w client tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add client/src/app/pages/PolicyGenerator/components/ArtifactActions.tsx
git commit -m "feat(policy-generator): add ArtifactActions with download and copy functionality"
```

---

## Task 11: ArtifactPanel Component

**Files:**
- Create: `client/src/app/pages/PolicyGenerator/components/ArtifactPanel.tsx`
- Create: `client/src/app/pages/PolicyGenerator/components/ArtifactPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// client/src/app/pages/PolicyGenerator/components/ArtifactPanel.test.tsx

import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ArtifactPanel } from "./ArtifactPanel";
import type { PolicyArtifacts } from "../types";

vi.mock("react-syntax-highlighter", () => ({
  Prism: ({ children }: { children: string }) => <pre>{children}</pre>,
}));

vi.mock("react-syntax-highlighter/dist/cjs/styles/prism", () => ({}));

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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -w client -- client/src/app/pages/PolicyGenerator/components/ArtifactPanel.test.tsx 2>&1 | tail -20`
Expected: FAIL — module `./ArtifactPanel` not found

- [ ] **Step 3: Write the ArtifactPanel component**

```tsx
// client/src/app/pages/PolicyGenerator/components/ArtifactPanel.tsx

import type React from "react";
import { useState } from "react";
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  Tab,
  Tabs,
  TabTitleText,
  Title,
  MenuToggle,
  Select,
  SelectOption,
  Split,
  SplitItem,
} from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";
import type { PolicyArtifacts } from "../types";
import { ArtifactCodeView } from "./ArtifactCodeView";
import { TestResultsBadge } from "./TestResultsBadge";
import { ArtifactActions } from "./ArtifactActions";

type TabKey = "rule" | "tests" | "config" | "data" | "command";

interface ArtifactPanelProps {
  artifacts: PolicyArtifacts | null;
  artifactHistory: PolicyArtifacts[];
  isValidating: boolean;
  onRunTests: () => void;
  validationError?: string | null;
}

export const ArtifactPanel: React.FC<ArtifactPanelProps> = ({
  artifacts,
  artifactHistory,
  isValidating,
  onRunTests,
  validationError,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>("rule");
  const [viewingVersion, setViewingVersion] = useState<number | null>(null);
  const [versionSelectOpen, setVersionSelectOpen] = useState(false);

  if (!artifacts) {
    return (
      <Bullseye style={{ height: "100%" }}>
        <EmptyState icon={CubesIcon}>
          <EmptyStateBody>
            Generated artifacts will appear here once you describe your policy
            requirements in the chat.
          </EmptyStateBody>
        </EmptyState>
      </Bullseye>
    );
  }

  const displayedArtifacts =
    viewingVersion !== null
      ? artifactHistory.find((a) => a.version === viewingVersion) ?? artifacts
      : artifacts;

  const getTabContent = (): { content: string; filename: string } => {
    switch (activeTab) {
      case "rule":
        return { content: displayedArtifacts.rule.content, filename: displayedArtifacts.rule.filename };
      case "tests":
        return { content: displayedArtifacts.tests.content, filename: displayedArtifacts.tests.filename };
      case "config":
        return { content: displayedArtifacts.config.content, filename: displayedArtifacts.config.filename };
      case "data":
        return displayedArtifacts.data
          ? { content: displayedArtifacts.data.content, filename: displayedArtifacts.data.filename }
          : { content: "No data file generated", filename: "none" };
      case "command":
        return { content: displayedArtifacts.command, filename: "command.sh" };
    }
  };

  const { content, filename } = getTabContent();
  const totalVersions = artifactHistory.length + 1;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderLeft: "1px solid var(--pf-t--global--border--color--default)",
      }}
    >
      <div
        style={{
          padding: "var(--pf-t--global--spacer--sm) var(--pf-t--global--spacer--md)",
          borderBottom: "1px solid var(--pf-t--global--border--color--default)",
        }}
      >
        <Split hasGutter>
          <SplitItem isFilled>
            <Title headingLevel="h3" size="md">
              Artifacts
            </Title>
          </SplitItem>
          {totalVersions > 1 && (
            <SplitItem>
              <Select
                isOpen={versionSelectOpen}
                onOpenChange={setVersionSelectOpen}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setVersionSelectOpen(!versionSelectOpen)}
                    isExpanded={versionSelectOpen}
                    style={{ minWidth: "80px" }}
                  >
                    v{viewingVersion ?? artifacts.version}
                  </MenuToggle>
                )}
                onSelect={(_event, value) => {
                  const v = Number(value);
                  setViewingVersion(v === artifacts.version ? null : v);
                  setVersionSelectOpen(false);
                }}
                selected={String(viewingVersion ?? artifacts.version)}
              >
                {[...artifactHistory, artifacts].map((a) => (
                  <SelectOption key={a.version} value={String(a.version)}>
                    v{a.version}
                    {a.version === artifacts.version ? " (latest)" : ""}
                  </SelectOption>
                ))}
              </Select>
            </SplitItem>
          )}
        </Split>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(_event, key) => setActiveTab(key as TabKey)}
        isFilled
      >
        <Tab
          eventKey="rule"
          title={<TabTitleText>{displayedArtifacts.rule.filename}</TabTitleText>}
        />
        <Tab
          eventKey="tests"
          title={<TabTitleText>{displayedArtifacts.tests.filename}</TabTitleText>}
        />
        <Tab
          eventKey="config"
          title={<TabTitleText>{displayedArtifacts.config.filename}</TabTitleText>}
        />
        {displayedArtifacts.data && (
          <Tab
            eventKey="data"
            title={<TabTitleText>{displayedArtifacts.data.filename}</TabTitleText>}
          />
        )}
        <Tab eventKey="command" title={<TabTitleText>Command</TabTitleText>} />
      </Tabs>

      <ArtifactCodeView content={content} filename={filename} />

      <TestResultsBadge
        testResults={displayedArtifacts.testResults}
        isValidating={isValidating}
        onRunTests={onRunTests}
        validationError={validationError}
      />

      <ArtifactActions artifacts={displayedArtifacts} activeTabContent={content} />
    </div>
  );
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -w client -- client/src/app/pages/PolicyGenerator/components/ArtifactPanel.test.tsx 2>&1 | tail -20`
Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add client/src/app/pages/PolicyGenerator/components/ArtifactPanel.tsx client/src/app/pages/PolicyGenerator/components/ArtifactPanel.test.tsx
git commit -m "feat(policy-generator): add ArtifactPanel with tabs, version selector, and artifact display"
```

---

## Task 12: PolicyGenerator Page

**Files:**
- Create: `client/src/app/pages/PolicyGenerator/PolicyGenerator.tsx`
- Create: `client/src/app/pages/PolicyGenerator/index.ts`

- [ ] **Step 1: Write the PolicyGenerator page component**

```tsx
// client/src/app/pages/PolicyGenerator/PolicyGenerator.tsx

import type React from "react";
import { useCallback, useState } from "react";
import {
  Button,
  Content,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  PageSection,
  Split,
  SplitItem,
} from "@patternfly/react-core";
import { PlusCircleIcon, HistoryIcon } from "@patternfly/react-icons";
import { DocumentMetadata } from "@app/components/DocumentMetadata";
import { usePolicyGenerate, usePolicyValidate } from "@app/queries/policies";
import { usePolicySession } from "./usePolicySession";
import { ChatPanel } from "./components/ChatPanel";
import { ArtifactPanel } from "./components/ArtifactPanel";
import type { ChatMessage, PolicyArtifacts, VerificationContext } from "./types";

export const PolicyGenerator: React.FC = () => {
  const {
    session,
    sessions,
    appendMessage,
    setArtifacts,
    setPolicyTypeFilter,
    newSession,
    loadSession,
  } = usePolicySession();

  const { generate, isGenerating, error: generateError, reset: resetGenerate } = usePolicyGenerate();
  const { validate, isValidating, error: validateError } = usePolicyValidate();

  const [historyOpen, setHistoryOpen] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const handleSendMessage = useCallback(
    async (
      message: string,
      options: { imageRef?: string; verification?: VerificationContext },
    ) => {
      setChatError(null);
      resetGenerate();

      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      };
      appendMessage(userMsg);

      try {
        const history = session.messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await generate({
          sessionId: session.id,
          message,
          history,
          context: {
            imageRef: options.imageRef,
            policyTypes: [session.policyTypeFilter],
            verification: options.verification,
          },
        });

        const nextVersion = session.currentArtifacts
          ? session.currentArtifacts.version + 1
          : 1;

        const artifacts: PolicyArtifacts | undefined = response.artifacts
          ? {
              rule: response.artifacts.rule,
              tests: response.artifacts.tests,
              config: response.artifacts.config,
              data: response.artifacts.data,
              command: response.artifacts.command,
              version: nextVersion,
            }
          : undefined;

        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: response.reply,
          artifacts,
          timestamp: new Date().toISOString(),
        };
        appendMessage(assistantMsg);

        if (artifacts) {
          setArtifacts(artifacts);
        }
      } catch {
        setChatError(
          "Failed to reach the policy service. Check your connection and try again.",
        );
      }
    },
    [session, appendMessage, generate, setArtifacts, resetGenerate],
  );

  const handleRunTests = useCallback(async () => {
    if (!session.currentArtifacts) return;

    try {
      const result = await validate({
        rule: session.currentArtifacts.rule.content,
        tests: session.currentArtifacts.tests.content,
      });

      setArtifacts({
        ...session.currentArtifacts,
        testResults: result,
      });
    } catch {
      // TestResultsBadge handles the error via validationError prop
    }
  }, [session.currentArtifacts, validate, setArtifacts]);

  return (
    <>
      <DocumentMetadata title="Policy Generator" />
      <PageSection variant="default">
        <Split>
          <SplitItem isFilled>
            <Content>
              <h1>Policy Generator</h1>
              <p>
                AI-assisted Conforma policy generation for SBOM and SLSA
                provenance
              </p>
            </Content>
          </SplitItem>
          <SplitItem>
            <Split hasGutter>
              <SplitItem>
                <Button
                  variant="secondary"
                  icon={<PlusCircleIcon />}
                  onClick={newSession}
                >
                  New Session
                </Button>
              </SplitItem>
              <SplitItem>
                <Dropdown
                  isOpen={historyOpen}
                  onOpenChange={setHistoryOpen}
                  toggle={(toggleRef) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setHistoryOpen(!historyOpen)}
                      isExpanded={historyOpen}
                      icon={<HistoryIcon />}
                    >
                      History
                    </MenuToggle>
                  )}
                >
                  <DropdownList>
                    {sessions.map((s) => (
                      <DropdownItem
                        key={s.id}
                        onClick={() => {
                          loadSession(s.id);
                          setHistoryOpen(false);
                        }}
                        description={`${s.messageCount} messages`}
                        isDisabled={s.id === session.id}
                      >
                        {s.title}
                      </DropdownItem>
                    ))}
                  </DropdownList>
                </Dropdown>
              </SplitItem>
            </Split>
          </SplitItem>
        </Split>
      </PageSection>

      <PageSection isFilled padding={{ default: "noPadding" }}>
        <div style={{ display: "flex", height: "calc(100vh - 220px)" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <ChatPanel
              messages={session.messages}
              isGenerating={isGenerating}
              policyTypeFilter={session.policyTypeFilter}
              onPolicyTypeChange={setPolicyTypeFilter}
              onSendMessage={handleSendMessage}
              error={chatError ?? (generateError ? generateError.message : null)}
              onRetry={() => setChatError(null)}
            />
          </div>
          <div style={{ width: "420px", flexShrink: 0 }}>
            <ArtifactPanel
              artifacts={session.currentArtifacts}
              artifactHistory={session.artifactHistory}
              isValidating={isValidating}
              onRunTests={handleRunTests}
              validationError={validateError ? "Validation unavailable" : null}
            />
          </div>
        </div>
      </PageSection>
    </>
  );
};
```

- [ ] **Step 2: Write the barrel export**

```typescript
// client/src/app/pages/PolicyGenerator/index.ts

export { PolicyGenerator as default } from "./PolicyGenerator";
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx -w client tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add client/src/app/pages/PolicyGenerator/PolicyGenerator.tsx client/src/app/pages/PolicyGenerator/index.ts
git commit -m "feat(policy-generator): add PolicyGenerator page with chat-artifact split layout"
```

---

## Task 13: Route and Sidebar Integration

**Files:**
- Modify: `client/src/app/Routes.tsx`
- Modify: `client/src/app/layout/sidebar.tsx`

- [ ] **Step 1: Add the route**

In `client/src/app/Routes.tsx`, add the lazy import after the existing ones (after line 8):

```typescript
const PolicyGenerator = lazy(() => import("./pages/PolicyGenerator"));
```

Add to the `Paths` object (after the `alerts` line):

```typescript
policyGenerator: "/policy-generator",
```

Add to the routes array (before the `"*"` catch-all route):

```typescript
{ path: Paths.policyGenerator, element: <PolicyGenerator /> },
```

- [ ] **Step 2: Add the sidebar entry**

In `client/src/app/layout/sidebar.tsx`, add a new `<li>` between the "Rekor Search" and "Alerts" entries (after line 64):

```tsx
<li className={nav.navItem}>
  <NavLink
    to={Paths.policyGenerator}
    className={({ isActive }) => {
      return css(LINK_CLASS, isActive ? ACTIVE_LINK_CLASS : "");
    }}
  >
    Policy Generator
  </NavLink>
</li>
```

- [ ] **Step 3: Verify the dev server renders the page**

Run: `npm run start:dev` (if not already running)
Navigate to: `http://localhost:3001/policy-generator`
Expected: The page renders with the split layout — empty chat panel on the left, empty artifacts panel on the right.

- [ ] **Step 4: Commit**

```bash
git add client/src/app/Routes.tsx client/src/app/layout/sidebar.tsx
git commit -m "feat(policy-generator): add route and sidebar navigation entry"
```

---

## Task 14: Page Integration Test

**Files:**
- Create: `client/src/app/pages/PolicyGenerator/PolicyGenerator.test.tsx`

- [ ] **Step 1: Write the page integration test**

```typescript
// client/src/app/pages/PolicyGenerator/PolicyGenerator.test.tsx

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
```

- [ ] **Step 2: Run the test**

Run: `npm run test -w client -- client/src/app/pages/PolicyGenerator/PolicyGenerator.test.tsx 2>&1 | tail -30`
Expected: PASS — 5 tests passing

- [ ] **Step 3: Commit**

```bash
git add client/src/app/pages/PolicyGenerator/PolicyGenerator.test.tsx
git commit -m "test(policy-generator): add page integration tests"
```

---

## Task 15: OpenAPI Spec Update

**Files:**
- Modify: `client/openapi/console.yaml`

- [ ] **Step 1: Add Policies tag to the tags section**

In `client/openapi/console.yaml`, add after the `Alerts` tag entry (around line 19):

```yaml
  - name: Policies
    description: AI-assisted Conforma policy generation and validation
```

- [ ] **Step 2: Add generate endpoint path**

Add the following path entry after the existing `/api/v1/alerts/{alertId}/acknowledge` path (before the `components:` section):

```yaml
  /api/v1/policies/generate:
    post:
      summary: Generate a Conforma policy from natural language requirements
      tags:
        - Policies
      operationId: GeneratePolicy
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GeneratePolicyRequest'
      responses:
        '200':
          description: Generated policy response with optional artifacts
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GeneratePolicyResponse'
        '429':
          description: Rate limit exceeded
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '500':
          description: AI service error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
  /api/v1/policies/validate:
    post:
      summary: Run OPA tests on generated policy artifacts
      tags:
        - Policies
      operationId: ValidatePolicy
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ValidatePolicyRequest'
      responses:
        '200':
          description: Validation results
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ValidatePolicyResponse'
        '500':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
```

- [ ] **Step 3: Add schema definitions**

Add the following schemas to the `components.schemas` section of `client/openapi/console.yaml`:

```yaml
    GeneratePolicyRequest:
      type: object
      required:
        - sessionId
        - message
        - history
      properties:
        sessionId:
          type: string
          description: Browser-generated UUID for the conversation session
        message:
          type: string
          description: The user's natural language policy requirement
        history:
          type: array
          items:
            type: object
            properties:
              role:
                type: string
                enum: [user, assistant]
              content:
                type: string
          description: Prior conversation turns for context
        context:
          type: object
          properties:
            imageRef:
              type: string
              description: Container image reference
              example: quay.io/myorg/myapp:latest
            policyTypes:
              type: array
              items:
                type: string
                enum: [sbom, slsa, both]
            sbomFormat:
              type: string
              enum: [spdx, cyclonedx, both]
            verification:
              type: object
              properties:
                type:
                  type: string
                  enum: [public-key, keyless]
                publicKey:
                  type: string
                  description: Cosign public key in PEM format
                oidcIssuer:
                  type: string
                identity:
                  type: string
    GeneratePolicyResponse:
      type: object
      properties:
        sessionId:
          type: string
        reply:
          type: string
          description: AI assistant response text
        artifacts:
          type: object
          nullable: true
          properties:
            rule:
              $ref: '#/components/schemas/ArtifactFile'
            tests:
              $ref: '#/components/schemas/ArtifactFile'
            config:
              $ref: '#/components/schemas/ArtifactFile'
            data:
              $ref: '#/components/schemas/ArtifactFile'
            command:
              type: string
        policyMeta:
          type: object
          properties:
            types:
              type: array
              items:
                type: string
            version:
              type: integer
    ValidatePolicyRequest:
      type: object
      required:
        - rule
        - tests
      properties:
        rule:
          type: string
          description: Rego v1 policy source
        tests:
          type: string
          description: Rego v1 test source
    ValidatePolicyResponse:
      type: object
      properties:
        passed:
          type: integer
        failed:
          type: integer
        results:
          type: array
          items:
            type: object
            properties:
              name:
                type: string
              status:
                type: string
                enum: [pass, fail]
    ArtifactFile:
      type: object
      properties:
        filename:
          type: string
        content:
          type: string
```

- [ ] **Step 4: Regenerate the SDK**

Run: `npm run generate 2>&1 | tail -10`
Expected: SDK generation completes without errors. New types for `GeneratePolicyRequest`, `GeneratePolicyResponse`, etc. appear in `client/src/app/client/`.

- [ ] **Step 5: Commit**

```bash
git add client/openapi/console.yaml client/src/app/client/
git commit -m "feat(policy-generator): add Policies endpoints to OpenAPI spec and regenerate SDK"
```

---

## Task 16: Wire SDK Types into Mutations (Integration Prep)

**Files:**
- Modify: `client/src/app/queries/policies.ts`

This task prepares the mutations to use SDK-generated functions when `MOCK=off`. The manual `client.post` calls stay as-is until the real AI microservice is available, but we import the SDK-generated types to ensure type alignment.

- [ ] **Step 1: Update the mutations to use SDK-generated types**

After running `npm run generate` in Task 15, check what function names were generated:

Run: `grep -r "generatePolicy\|validatePolicy\|GeneratePolicy\|ValidatePolicy" client/src/app/client/ --include="*.ts" | head -10`

Update `client/src/app/queries/policies.ts` — replace the manual type imports with SDK-generated types if they match. If the generated function signatures match, switch from `client.post` to the generated SDK functions. If not, keep the manual `client.post` calls with a comment noting the SDK functions to switch to once the API is live.

- [ ] **Step 2: Verify tests still pass**

Run: `npm run test -w client -- client/src/app/queries/policies.test.ts 2>&1 | tail -20`
Expected: PASS — 2 tests passing

- [ ] **Step 3: Commit**

```bash
git add client/src/app/queries/policies.ts
git commit -m "refactor(policy-generator): align mutation types with SDK-generated definitions"
```

---

## Task 17: Full Test Suite Verification

**Files:** (no new files — verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm run test 2>&1 | tail -30`
Expected: All existing tests pass. All new tests pass. No regressions.

- [ ] **Step 2: Run the linter**

Run: `npm run lint 2>&1 | tail -20`
Expected: No new lint errors introduced.

- [ ] **Step 3: Run TypeScript type check**

Run: `npx -w client tsc --noEmit --pretty 2>&1 | tail -20`
Expected: No type errors.

- [ ] **Step 4: Verify the page works with MOCK=on**

Start the dev server with `MOCK=on`. Navigate to `/policy-generator`. Verify:
1. Page renders with split layout
2. Chat panel shows empty state prompt
3. Artifact panel shows empty state
4. Send a message — user message appears in chat
5. After mock delay (~1.5s), assistant response appears with artifact summary card
6. Artifact panel populates with rule, tests, config, data tabs
7. Switching tabs shows different content with syntax highlighting
8. "Run tests" button triggers mock validation
9. "New Session" creates a fresh empty session
10. "Copy" button copies active tab content
11. "Download All Files" triggers file downloads

- [ ] **Step 5: Fix any issues found and commit**

```bash
git add -A
git commit -m "fix(policy-generator): address integration issues found during manual testing"
```

---

## Self-Review

### Spec Coverage Check

| Spec Section | Covered By |
|---|---|
| Architecture (Express proxy, split panel) | Task 12 (page layout), no proxy changes needed |
| API contract (generate, validate) | Task 3 (mutations), Task 15 (OpenAPI) |
| UI component hierarchy | Tasks 5-12 (all components) |
| Data types (PolicySession, ChatMessage, etc.) | Task 1 (types) |
| Session hook (usePolicySession) | Task 4 |
| Data flow (send → append → mutate → render) | Task 12 (PolicyGenerator orchestration) |
| Error handling (network, timeout, localStorage) | Tasks 7, 9, 12 (ChatPanel error display, TestResultsBadge, page error state) |
| Mock data strategy | Task 2 (realistic multi-turn Rego v1 artifacts) |
| Routing & sidebar | Task 13 |
| Artifact versioning | Tasks 4, 11 (usePolicySession history, ArtifactPanel version selector) |
| Verification credentials (cosign key, OIDC) | Task 6 (ChatInput expandable credentials section) |
| Syntax highlighting (Prism) | Task 8 (ArtifactCodeView, reuses existing react-syntax-highlighter) |
| Test results (OPA validation) | Task 9 (TestResultsBadge) |
| Download / copy actions | Task 10 (ArtifactActions) |
| OpenAPI spec update | Task 15 |
| SDK type alignment | Task 16 |

### Placeholder Scan

No "TBD", "TODO", "implement later", or "add appropriate error handling" placeholders found. All steps contain complete code.

### Type Consistency Check

- `PolicySession`, `ChatMessage`, `PolicyArtifacts`, `ArtifactFile`, `TestResults` — defined in Task 1, used consistently in Tasks 2-12.
- `GenerateRequest`, `GenerateResponse`, `ValidateRequest`, `ValidateResponse` — defined in Task 1, used in Task 3 mutations and Task 12 page.
- `VerificationContext` — defined in Task 1, used in Tasks 6 and 12.
- `SessionSummary` — defined in Task 1, returned by Task 4 hook, consumed in Task 12 dropdown.
- `usePolicyGenerate`, `usePolicyValidate` — defined in Task 3, consumed in Task 12.
- `usePolicySession` — defined in Task 4, consumed in Task 12.
- Hook return shapes (`generate`, `isGenerating`, `error`, `reset`) match between Task 3 definition and Task 12 consumption.
