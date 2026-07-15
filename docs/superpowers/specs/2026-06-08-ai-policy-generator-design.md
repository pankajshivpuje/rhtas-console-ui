# AI-Assisted Policy Generation for Conforma — Design Spec

**Date:** 2026-06-08
**Status:** Draft
**Author:** Pankaj Shivpuje (with Claude Code)

## Overview

Add AI-assisted Conforma policy generation to the RHTAS Console. Users describe supply chain security requirements in natural language and receive complete, tested, deployable policies covering SBOM composition and SLSA build provenance — with no Rego knowledge required.

The feature is delivered in phases: CLI skill first (developer tool), then an AI microservice backend, then a Console UI page. The Console UI uses a chat-primary interface with a fixed split panel — conversation on the left, tabbed artifact viewer on the right.

## Problem

Adopting Conforma requires expertise in Rego v1 syntax, SBOM attestation structures (SPDX/CycloneDX), SLSA v1.0 build provenance models, and Conforma conventions. This learning curve spans days to weeks per policy. Organizations delay adoption, write incorrect policies, or bottleneck on scarce Rego experts while compliance requirements (SLSA, FedRAMP, executive orders) multiply.

## Target Persona

**Primary:** Platform Engineer / DevOps Engineer responsible for supply chain security in CI/CD pipelines. Understands compliance mandates but lacks Rego expertise.

**Secondary:** Security/Compliance Lead prototyping policies against real images. Conforma Contributor using AI output as a starting point for upstream rules.

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Delivery phasing | CLI skill → AI microservice → Console UI | CLI validates AI quality; Console UI built with mocks in parallel |
| AI backend integration | Express proxy to AI microservice | Matches existing `/api` proxy pattern in `server/src/proxies.js` |
| Interaction model | Chat-primary | Core value is natural language → policy; matches iterative refinement requirement |
| Layout | Fixed split panel (chat left, artifacts right) | Artifacts always visible while conversing; no toggling |
| Policy scope | Both SBOM + SLSA from day one | CLI MVP already validated both; no reason to phase |
| Session persistence | localStorage | No backend storage complexity for MVP; browser continuity |
| Authentication | None for MVP | Prototype phase; auth addressed when productizing |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  RHTAS Console (React + PatternFly)                     │ │
│  │  ┌──────────────┐  ┌──────────────────────────────────┐ │ │
│  │  │  Sidebar Nav  │  │  Policy Generator Page           │ │ │
│  │  │  ...          │  │  ┌────────────┬────────────────┐ │ │ │
│  │  │  Policy Gen ● │  │  │  Chat      │  Artifact Tabs │ │ │ │
│  │  │  ...          │  │  │  Panel     │  (Rule/Tests/  │ │ │ │
│  │  │              │  │  │            │   Config/CMD)  │ │ │ │
│  │  └──────────────┘  │  └────────────┴────────────────┘ │ │ │
│  │                     └──────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│         │  POST /api/v1/policies/generate                    │
│         │  POST /api/v1/policies/validate                    │
└─────────┼───────────────────────────────────────────────────┘
          ▼
┌──────────────────┐         ┌──────────────────────────┐
│  Express Server  │────────▶│  AI Policy Microservice   │
│  (proxy layer)   │  proxy  │  - LLM + Conforma context │
│  /api/v1/policies│         │  - Rego generation        │
└──────────────────┘         │  - OPA test runner        │
                             └──────────────────────────┘
```

The existing `/api` pathFilter in `server/src/proxies.js` already covers `/api/v1/policies/*` — no proxy changes needed.

## API Contract

### POST /api/v1/policies/generate

Send a user message in the context of a conversation. Returns the AI's reply and optionally generated policy artifacts.

**Request:**
```json
{
  "sessionId": "local-uuid-from-browser",
  "message": "Ensure all images are built by our Tekton pipeline from main with hermetic builds",
  "history": [
    { "role": "assistant", "content": "Welcome! I can generate Conforma policies..." },
    { "role": "user", "content": "I need SLSA provenance validation for..." },
    { "role": "assistant", "content": "I'll generate a policy that..." }
  ],
  "context": {
    "imageRef": "quay.io/myorg/myapp:latest",
    "policyTypes": ["sbom", "slsa"],
    "verification": {
      "type": "public-key",
      "publicKey": "-----BEGIN PUBLIC KEY-----\nMFkwEwYH..."
    }
  }
}
```

The `history` field contains prior conversation turns so the AI service can maintain context without server-side session state. On the first message of a session, `history` is an empty array.

The `context.verification` field accepts the user's signing identity in one of two forms:

```typescript
type VerificationContext =
  | { type: "public-key"; publicKey: string }        // cosign public key (PEM)
  | { type: "keyless"; oidcIssuer: string; identity: string }  // OIDC identity/issuer
```

This is required to generate a complete `ec validate image` command. The ChatInput provides optional fields for image reference and verification credentials alongside the natural language input. Users can also provide these inline in the chat message — the AI service extracts them from natural language if the structured fields are not set.

**Response:**
```json
{
  "sessionId": "local-uuid-from-browser",
  "reply": "I'll generate a SLSA Build L3 provenance policy that validates...",
  "artifacts": {
    "rule": { "filename": "policy.rego", "content": "package policy.slsa\n..." },
    "tests": { "filename": "policy_test.rego", "content": "package policy.slsa_test\n..." },
    "config": { "filename": "policy.yaml", "content": "sources:\n  - policy:\n..." },
    "data": { "filename": "allowed_sources.json", "content": "{\"allowed_builders\":[...],\"allowed_repos\":[...]}" },
    "command": "ec validate image --image quay.io/myorg/myapp:latest --policy policy.yaml --public-key cosign.pub"
  },
  "policyMeta": {
    "types": ["slsa-provenance"],
    "version": 1
  }
}
```

The `artifacts` field is null when the AI response is purely conversational (e.g., asking a clarifying question). The `context` field is optional — users can provide image ref and policy type preferences, or just describe requirements in natural language.

#### SBOM Format Handling

SBOM composition policies must handle both SPDX and CycloneDX attestation formats, which have different data structures. The AI service handles this as follows:

- **Default:** Generated SBOM policies target SPDX format (the more common format in Red Hat ecosystems)
- **User-specified:** If the user mentions CycloneDX in their requirements, the AI generates CycloneDX-specific policies
- **Dual-format:** If the user requests both or says "any SBOM format," the AI generates separate rules for each format within the same policy file, with a shared allowed-sources data file
- The `context` object accepts an optional `sbomFormat` field: `"spdx"` (default), `"cyclonedx"`, or `"both"`
- The generated OPA tests include attestation fixtures for the targeted format(s)

### POST /api/v1/policies/validate

Run OPA tests on generated policy artifacts. Returns test results.

**Request:**
```json
{
  "rule": "package policy.slsa\n...",
  "tests": "package policy.slsa_test\n..."
}
```

**Response:**
```json
{
  "passed": 5,
  "failed": 0,
  "results": [
    { "name": "test_valid_builder_id", "status": "pass" },
    { "name": "test_invalid_builder_id_denied", "status": "pass" },
    { "name": "test_unauthorized_source_denied", "status": "pass" },
    { "name": "test_non_hermetic_build_denied", "status": "pass" },
    { "name": "test_valid_full_provenance", "status": "pass" }
  ]
}
```

## UI Component Design

### Page Structure

```
PolicyGenerator (page)
├── PolicyPageHeader        — title, description, New Session / History buttons
├── ChatPanel               — left side of split
│   ├── ChatMessageList
│   │   └── ChatMessage     — role (user/assistant), content, artifacts ref
│   └── ChatInput           — text input, policy type chips, send button
└── ArtifactPanel           — right side of split
    ├── ArtifactTabs        — Rule / Tests / Config / Data / Command
    ├── ArtifactCodeView    — syntax-highlighted code display
    ├── TestResultsBadge    — pass/fail count, run tests button
    └── ArtifactActions     — download zip, copy to clipboard
```

### File Structure

```
client/src/app/pages/PolicyGenerator/
├── PolicyGenerator.tsx
├── index.ts
├── components/
│   ├── ChatPanel.tsx
│   ├── ChatMessage.tsx
│   ├── ChatInput.tsx
│   ├── ArtifactPanel.tsx
│   ├── ArtifactCodeView.tsx
│   ├── ArtifactTabs.tsx
│   ├── TestResultsBadge.tsx
│   └── ArtifactActions.tsx

client/src/app/queries/policies.ts
client/src/app/queries/mocks/policies.mock.ts
```

### Component Responsibilities

| Component | Responsibility |
|---|---|
| `PolicyGenerator` | Page container. Manages session state via `usePolicySession` hook. Orchestrates chat → artifact flow. |
| `ChatPanel` | Left split. Renders message list and input. Calls `usePolicyGenerate` mutation on send. |
| `ChatMessage` | Single message bubble. User messages right-aligned, assistant left-aligned. Assistant messages with artifacts show a summary card linking to the panel. |
| `ChatInput` | Text input with policy type filter chips (SBOM + SLSA / SLSA only / SBOM only), optional collapsible fields for image reference and verification credentials (public key upload or OIDC issuer/identity), and send button. Chips set `context.policyTypes`; credential fields set `context.verification` on the API request. |
| `ArtifactPanel` | Right split. Tabbed view of the latest generated artifacts. Updates when new artifacts arrive. |
| `ArtifactCodeView` | Syntax-highlighted code display using Prism (already used in RekorSearch). Language detection: `.rego` → Rego, `.yaml` → YAML, command → bash. |
| `TestResultsBadge` | Shows OPA test pass/fail count from the last validation. "Run tests" button triggers `usePolicyValidate` mutation. |
| `ArtifactActions` | "Download Bundle (.zip)" packages all artifact files. "Copy" copies the active tab's content to clipboard. |

## Data Flow & State Management

### State Types

```typescript
interface PolicySession {
  id: string;
  messages: ChatMessage[];
  currentArtifacts: PolicyArtifacts | null;
  artifactHistory: PolicyArtifacts[];  // previous artifact versions, ordered oldest-first
  policyTypeFilter: PolicyType;
  createdAt: string;
  title: string;
}

type PolicyType = "both" | "slsa" | "sbom";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  artifacts?: PolicyArtifacts;
  timestamp: string;
}

interface PolicyArtifacts {
  rule: ArtifactFile;
  tests: ArtifactFile;
  config: ArtifactFile;
  data?: ArtifactFile;           // externalized allowed sources / config data (e.g., allowed_sources.json)
  command: string;
  version: number;
  testResults?: TestResults;
}

interface ArtifactFile {
  filename: string;
  content: string;
}

interface TestResults {
  passed: number;
  failed: number;
  results: Array<{ name: string; status: "pass" | "fail" }>;
}
```

### Session Hook

```typescript
function usePolicySession() {
  // Returns:
  //   session: PolicySession          — current active session
  //   sessions: SessionSummary[]      — list for history dropdown
  //   sendMessage(text): void         — appends user msg, triggers mutation
  //   newSession(): void              — creates fresh session
  //   loadSession(id): void           — switches to previous session
  //   isGenerating: boolean           — mutation loading state
}
```

### Data Flow

1. User types message in `ChatInput`, clicks Send
2. `PolicyGenerator` appends user message to `session.messages`, saves to localStorage
3. `usePolicyGenerate.mutate()` fires — sends message + conversation context to `/api/v1/policies/generate`
4. On success: appends assistant message to `session.messages`. If response includes artifacts, pushes `currentArtifacts` onto `artifactHistory` and sets `currentArtifacts` to the new version. Saves to localStorage.
5. `ChatPanel` re-renders with new messages; `ArtifactPanel` re-renders with new code
6. User can click "Run tests" → `usePolicyValidate.mutate()` → `TestResultsBadge` updates

### Artifact Versioning

When the user iteratively refines a policy, each new artifact set is versioned:

- `currentArtifacts` always holds the latest version
- `artifactHistory` holds all previous versions (ordered oldest-first)
- The `ArtifactPanel` header shows "v3" and a version selector dropdown to view/compare prior versions
- Selecting a previous version renders it read-only in the code viewer with a "Restore" action
- `ChatMessage` components with artifacts show which version they produced (e.g., "v1", "v2")
- The download action always exports `currentArtifacts` unless viewing a historical version

### Mock Data Strategy

Following the existing `useMockableQuery` / `MOCK` env var pattern. The `policies.mock.ts` file provides a realistic multi-turn conversation:

- Turn 1: User describes SLSA requirements → assistant generates 4 artifact files (rule, tests, config, allowed sources data)
- Turn 2: User asks to also add SBOM policy → assistant generates updated bundle (v2) — both SLSA and SBOM rules
- Turn 3: User refines ("add exception for golang.org") → assistant updates the SBOM rule and allowed sources data (v3)

Mock artifacts contain valid Rego v1 syntax so the syntax highlighter and UI render correctly. The mock data includes artifact version history to exercise the version selector in the ArtifactPanel.

## Error Handling

### API Errors

| Error | UI Behavior |
|---|---|
| Network failure / timeout | Chat shows inline error below the user's message: "Failed to reach the policy service. Check your connection and try again." with a Retry button. The user's message stays in the chat. |
| AI service 500 | Chat shows: "The policy service encountered an error. Try rephrasing your request." with a Retry button. |
| AI service 429 (rate limit) | Chat shows: "Too many requests. Please wait a moment and try again." No retry button — auto-retry after backoff. |
| Malformed AI response | If the response JSON is valid but `artifacts` content is not valid Rego (e.g., syntax errors), display the artifacts anyway with a warning badge: "Generated code may contain errors — review before using." The validate endpoint catches this when the user runs tests. |
| Validate endpoint failure | `TestResultsBadge` shows "Validation unavailable" with a retry icon instead of pass/fail counts. |

### Generation Timeout

LLM policy generation can take 15-30 seconds. The UI handles this with:

- `ChatInput` disabled with a "Generating..." state and a pulsing indicator in the chat
- 60-second client-side timeout — if exceeded, show "Generation is taking longer than expected. You can wait or cancel and try a simpler request." with Cancel and Wait buttons
- Cancel aborts the request and removes the pending assistant message placeholder

### localStorage Errors

- **Quota exceeded:** If localStorage write fails, show a toast notification: "Session storage is full. Consider clearing old sessions from History." The current session continues in memory but won't persist across page reloads.
- **Corrupted data:** If session data fails to parse on load, discard the corrupted session and start fresh. Log the error to the console.

## Routing & App Integration

### Route

```typescript
// Routes.tsx
const PolicyGenerator = lazy(() => import("./pages/PolicyGenerator"));

export const Paths = {
  // ...existing
  policyGenerator: "/policy-generator",
} as const;

// Route entry
{ path: Paths.policyGenerator, element: <PolicyGenerator /> }
```

### Sidebar

New entry in `sidebar.tsx` between "Rekor Search" and "Alerts":

```
System Health
Trust Coverage
Trust Root
Artifacts
Rekor Search
Policy Generator  ← new
Alerts
```

### OpenAPI Spec

New `Policies` tag and two endpoint definitions added to `client/openapi/console.yaml`. Running `npm run generate` produces typed SDK functions (`generatePolicy`, `validatePolicy`) in `client/src/app/client/`.

### Proxy

No changes needed — the existing `/api` pathFilter in `server/src/proxies.js` already covers `/api/v1/policies/*`.

## Phasing Plan

### Phase 1: CLI Skill (Weeks 1-3)

Claude Code custom skill at `.claude/skills/generate-policy/` with:
- `SKILL.md` with embedded Conforma domain knowledge covering:
  - Rego v1 syntax patterns (deny rules, imports, comprehensions, sprintf)
  - SPDX SBOM attestation structure (packages, externalRefs, supplier)
  - CycloneDX SBOM attestation structure (components, purl, supplier)
  - SLSA v1.0 provenance model (BuildDefinition, RunDetails, builder.id, resolvedDependencies, externalParameters)
  - Conforma conventions (package naming, deny pattern, data externalization, annotation format)
  - Conforma slsa3 rule collection structure for compatibility
- Prompt templates for SBOM composition and SLSA provenance
- Output templates: policy.rego, policy_test.rego, policy.yaml, allowed_sources.json, ec validate command
- End-to-end validation: generate → OPA test pass → ec validate success on at least 3 reference images

### Phase 2: AI Policy Microservice (Weeks 3-6)

Deployable service extracted from CLI skill knowledge:
- `POST /api/v1/policies/generate` — LLM with Conforma domain context
- `POST /api/v1/policies/validate` — OPA test runner
- Stateless design — client sends conversation history per request
- API contract tests
- SLSA acceptance criteria tests: verify generated policies cover all five SLSA checks (see Success Criteria)
- Conforma compatibility tests: verify generated policies follow package naming, deny pattern, and data externalization conventions
- End-to-end ec validate tests against reference images with known attestations to validate the >= 95% success rate target

### Phase 3: Console UI (Weeks 5-8, overlaps Phase 2)

**Weeks 5-6 (mock-driven):**
- Route, sidebar, page scaffolding
- ChatPanel, ChatMessage, ChatInput components
- ArtifactPanel, ArtifactCodeView, ArtifactTabs
- `usePolicySession` localStorage hook
- `policies.mock.ts` with realistic conversations
- Full UI functional with `MOCK=on`

**Weeks 7-8 (integration):**
- OpenAPI spec entries + `npm run generate`
- `usePolicyGenerate` and `usePolicyValidate` mutations wired to real service
- ArtifactActions (download zip, copy)
- TestResultsBadge with live OPA validation
- E2E tests with Playwright

### Phase 4: Polish & Iterate (Weeks 8-10)

- SSE streaming for real-time token display
- Session history improvements (search, rename, delete)
- Conversation starters / example prompts for common patterns
- Feature gating / auth for production
- Accessibility audit

### Dependency Graph

```
Phase 1 (CLI Skill) ─── domain knowledge ──▶ Phase 2 (AI Microservice)
                                                  │
                                    API contract   │
                                                  ▼
                                            Phase 3 (Console UI)
                                                  │
                                                  ▼
                                            Phase 4 (Polish)

Phase 3 frontend starts at Week 5 using mocks (not blocked by Phase 2)
Phase 3 integrates with Phase 2 at Week 7
```

## Success Criteria

### Efficiency Metrics

- Time-to-first-policy reduced from days/weeks to under 10 minutes
- 100% OPA test pass rate at generation time
- 100% syntactically valid policy.yaml output
- 100% Rego v1 compliance in generated policies
- >= 95% end-to-end ec validate image success rate on images with valid attestations

### SLSA Provenance Acceptance Criteria

Generated SLSA provenance policies must validate all of the following when the user's requirements call for them:

| Check | What the generated rule must validate |
|---|---|
| Builder ID pinning | `predicate.runDetails.builder.id` matches the user-specified builder identity |
| Predicate type | Attestation `predicateType` is `https://slsa.dev/provenance/v1` |
| Source-material correlation | `predicate.buildDefinition.resolvedDependencies` contains the expected source repo + commit digest |
| Hermetic build enforcement | `predicate.buildDefinition.buildType` or build config indicates hermetic execution |
| Build L3 compliance | Generated policy is composable with Conforma's `slsa3` rule collection without conflicts |

These checks are not all-or-nothing — the AI generates the subset relevant to the user's stated requirements. But when a user asks for "SLSA Build L3 compliance," all five checks must be present.

### Conforma Compatibility Requirements

Generated policies must follow Conforma conventions so they compose with existing rule collections:

- **Package naming:** `package policy.<descriptive_name>` (e.g., `policy.slsa_provenance`, `policy.sbom_sources`)
- **Deny rule pattern:** `deny contains msg if { ... }` — Conforma's standard enforcement pattern
- **External data separation:** Configurable values (allowed builders, source repos, package sources) externalized to a data file (`allowed_sources.json`) and referenced via `data.allowed_*` in the rule, not hardcoded
- **Annotation conventions:** Rules annotated with `# title:` and `# description:` comments per Conforma conventions
- **Test structure:** Test file uses `package <policy_package>_test` naming; includes positive (pass) and negative (deny) test cases with realistic attestation fixtures

### Adoption Metrics (Post-MVP)

The following metrics from the feature request require instrumentation not included in MVP. They are listed here as targets for the production release:

- >= 50% of new Conforma policy authors use the AI generator for their first policy within 3 months
- >= 30% of all new policies originate from AI generation within 6 months
- Policy authoring errors reduced by >= 70% vs. manual authoring
- Support tickets for Rego/EC syntax issues decrease by >= 40% within 6 months of GA

Measurement approach: add opt-in telemetry events (session start, policy generated, policy downloaded, ec validate invoked) in a post-MVP phase. Baseline error rates and support ticket counts should be captured before GA.

## Architectural Note

The original feature request positions the CLI skill as the sole target surface ("requires no additional infrastructure — runs wherever Claude Code runs"). This spec extends beyond that scope by adding an AI microservice (Phase 2) and a Console UI (Phase 3). This is an intentional product evolution: the CLI skill validates AI quality and builds domain knowledge (Phase 1), while the microservice + UI make the capability accessible to users who don't use Claude Code. Phase 1 is fully aligned with the feature request; Phases 2-3 are additive.

## Out of Scope (MVP)

- Authentication / feature gating (planned for Phase 4; will follow existing RHTAS product auth patterns)
- Server-side session persistence
- SSE streaming responses
- Policy deployment to clusters from the UI
- Policy version diffing (visual diff between artifact versions — MVP shows versions but not inline diffs)
- Multi-user collaboration on policy sessions
- Integration with existing Conforma policy bundle repositories
- Adoption telemetry and analytics instrumentation (see Adoption Metrics under Success Criteria)
