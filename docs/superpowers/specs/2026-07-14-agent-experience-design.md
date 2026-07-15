# RHTAS Console Agent Experience — Design Spec

**Date:** 2026-07-14
**Status:** Draft
**Author:** Pankaj Shivpuje + Claude

## Overview

An AI agent experience embedded in the RHTAS Console that proactively monitors signing infrastructure health and enables natural language investigation. The agent scans system health, signed artifacts, attestation coverage, policy compliance, TUF root certificates, and active alerts — surfacing issues as insight cards and answering user questions in a conversational interface.

This initial version is **mock-only**: no real LLM integration. The full UI experience is built with simulated agent responses derived from existing mock data, establishing the interaction patterns and API contract for future backend integration.

## Goals

1. Give users a single place to assess overall signing infrastructure health without visiting 7 separate pages.
2. Surface issues proactively so users don't have to hunt for problems.
3. Enable natural language queries like "Which production artifacts are missing attestations?" or "When does the TUF root expire?"
4. Establish a clear API contract (`/api/v1/agent/*`) so a real LLM backend can be plugged in later with no frontend changes.

## Non-Goals

- Real LLM integration (deferred to a future iteration).
- Autonomous remediation actions (the agent observes and advises, it does not modify state).
- Real-time websocket streaming (simulated with progressive text reveal for now).
- Multi-conversation history (v1 uses a single active conversation; history deferred until backend persistence exists).

---

## UI Surface

### 1. Dedicated Agent Page (`/agent`)

Two vertically stacked zones:

**Insights Dashboard (top)**
- Summary bar: `"2 Critical · 3 Warnings · 1 Info"` with severity-colored counts.
- Grid of `InsightCard` components, each showing:
  - Severity icon (critical = red, warning = orange, info = blue)
  - Title (e.g., "TUF root metadata expires in 12 days")
  - Short description (1-2 sentences)
  - Domain label (e.g., "Trust Root", "Attestations")
  - Timestamp
  - Click action: pre-fills the chat input with `suggestedPrompt` and scrolls to the chat panel
- Empty state: "No issues detected. Your signing infrastructure looks healthy."

**Chat Panel (bottom)**
- Single-conversation mode (no conversation sidebar in v1 — simplifies UX until backend persistence exists).
- Main area: scrollable message timeline.
  - User messages: right-aligned, blue background.
  - Agent messages: left-aligned, with robot avatar. Content rendered as markdown (tables, bullet points, bold, code).
- Bottom: `ChatInput` with text field, send button, and suggested prompt chips (shown only when conversation is empty).
- "New conversation" button in the panel header to clear current messages and start fresh.
- Streaming simulation: agent responses appear character-by-character over ~2 seconds.
- Conversation state persisted to `localStorage` so messages survive page navigation and refresh.

### 2. Floating Trigger (global, in masthead)

A button in the `HeaderApp` toolbar, positioned between the alert bell and dark mode toggle:
- Icon: `RobotIcon` (or PatternFly equivalent)
- Badge: total insight count (hidden when 0)
- Click: opens a `Popover` showing:
  - Top 3 insights (condensed: severity icon + title only)
  - "View all insights" link → navigates to `/agent`
  - Mini chat input → on submit, navigates to `/agent` with the prompt pre-filled as a query param

### 3. Sidebar Navigation

New nav item "Agent" added **after "System Health"** (second position) in the sidebar with a PatternFly badge labeled "New". Current nav order: System Health, **Agent**, Trust Coverage, Trust Root, Artifacts, Rekor Search, Alerts, Artifact policy evaluation.

### 4. Route Definition

```typescript
// In Routes.tsx
const Agent = lazy(() => import("./pages/Agent"));

// In Paths
agent: "/agent",

// In route array
{ path: Paths.agent, element: <Agent /> },
```

---

## Data Model

### AgentInsight

```typescript
interface AgentInsight {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  domain: "signing" | "attestations" | "trust-root" | "alerts" | "policy" | "health";
  timestamp: string; // ISO 8601
  suggestedPrompt: string;
  relatedLink?: {
    label: string;
    path: string; // internal route, e.g., "/trust-root"
  };
}
```

### ChatMessage

```typescript
interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string; // markdown for agent messages, plain text for user messages
  timestamp: string;
  insightId?: string; // set when message was triggered by clicking an insight card
  status?: "sending" | "streaming" | "complete" | "error";
}
```

### AgentConversation (deferred to v2)

> v1 uses a single active conversation stored in localStorage. The `AgentConversation` type is defined for the API contract but not exposed in the UI.

```typescript
interface AgentConversation {
  id: string;
  title: string; // auto-generated from first user message
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  preview: string; // first ~100 chars of last agent response
}
```

### AgentSummary

```typescript
interface AgentSummary {
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  totalCount: number;
}
```

---

## API Contract

All endpoints under `/api/v1/agent/`. Fully mocked in v1.

| Method | Path | Request | Response | Purpose |
|--------|------|---------|----------|---------|
| GET | `/api/v1/agent/insights` | — | `AgentInsight[]` | Fetch proactive findings |
| GET | `/api/v1/agent/insights/summary` | — | `AgentSummary` | Badge count for floating trigger |
| POST | `/api/v1/agent/chat` | `{ conversationId: string, message: string }` | `ChatMessage` | Send a message, get agent response |
| GET | `/api/v1/agent/conversations` | — | `AgentConversation[]` | List past conversations |
| GET | `/api/v1/agent/conversations/{id}/messages` | — | `ChatMessage[]` | Get messages for a conversation |
| POST | `/api/v1/agent/chat/stream` | `{ conversationId: string, message: string }` | SSE `text/event-stream` | Stream agent response (v2 — defined now for contract stability) |

### Error Responses

All endpoints return standard error shapes:

| Status | Body | When |
|--------|------|------|
| 400 | `{ error: "message is required" }` | Missing required fields |
| 500 | `{ error: "Internal server error" }` | Server failure |

Mock mode never returns errors by default. To test error states, the mock handler checks for a `?simulateError=true` query param.

### Future integration point

When a real LLM backend is added, only the server-side implementations of these endpoints change. The frontend stays the same. The server would:
1. Aggregate data from all existing API endpoints (dashboard, alerts, trust, health, etc.)
2. Build a system prompt with the aggregated context
3. Forward the user's message to the LLM
4. Stream the response back

---

## Mock Data Strategy

### Dynamic Response Generation

The mock chat handler imports existing mock data sources and builds responses from them:

```typescript
function generateAgentResponse(
  userMessage: string,
  context: {
    postureSummary: PostureSummary;
    signedArtifacts: SignedArtifact[];
    alerts: Alert[];
    trustRootMetadata: RootMetadataInfo[];
    serviceHealth: ServiceHealth;
    // ... other mock data
  }
): string
```

**Keyword routing** determines which data to emphasize:

| Keywords | Data Source | Example Response |
|----------|------------|------------------|
| attestation, attest, sbom, provenance | `getSignedArtifactsMock`, `getAttestationCoverageMock` | Lists artifacts without attestations, shows coverage by type |
| certificate, expir, tuf, root | `trustRootMetadataInfoMock` | Shows certificate expiry dates, renewal guidance |
| policy, violation, compliance, conforma | `mockConformaResult` | Lists policy violations with affected artifacts |
| health, status, service, rekor, fulcio | `serviceHealthMock` | Service status summary |
| sign, artifact, coverage | `getPostureSummaryMock`, `getSignedArtifactsMock` | Signing posture summary with counts |
| alert, incident, firing | `alertsMock` | Alert summary by severity |
| (default) | All sources | General signing infrastructure health summary |

Responses are formatted as markdown with tables and actionable recommendations.

**Fallback handling:** When no keywords match, the agent returns a general signing infrastructure health summary using all data sources:

> "I don't have specific information about that topic. Here's a summary of your current signing infrastructure health:
>
> - **Signed artifacts:** 87 total, 72 with attestations (82.8% coverage)
> - **Active alerts:** 2 critical, 1 warning
> - **TUF root:** Valid, expires in 12 days
>
> Try asking about specific topics like attestations, certificates, alerts, or signing activity."

This ensures no query produces a dead end.

### Error UX States

| Scenario | UI Behavior |
|----------|-------------|
| Insight fetch failure | InsightsDashboard shows `EmptyState` with "Unable to load insights. Try refreshing the page." and a retry button |
| Chat send failure (network) | The user's message stays in the input. An inline `Alert` (danger) appears: "Failed to send message. Please try again." with a retry button |
| Chat response empty/malformed | Agent message shows: "I wasn't able to generate a response. Please try rephrasing your question." |
| Streaming interrupted (unmount) | `useStreamingMessage` hook cleans up interval on unmount — no orphaned timers |

### Mock Insights (8 findings)

| # | Severity | Domain | Title | Suggested Prompt |
|---|----------|--------|-------|-----------------|
| 1 | critical | trust-root | TUF root metadata expires in 12 days | Tell me more about the expiring TUF root and what I need to do |
| 2 | critical | health | Rekor transparency log returned errors | What is the current status of the Rekor service? |
| 3 | warning | attestations | 27% of production artifacts lack attestations | Which production artifacts are missing attestations? |
| 4 | warning | policy | 3 artifacts failing enterprise signing policy | Show me the policy violations and affected artifacts |
| 5 | warning | signing | Signing rate dropped 40% in the last 7 days | What's causing the drop in signing activity? |
| 6 | warning | alerts | 2 unacknowledged critical alerts | Summarize the unacknowledged critical alerts |
| 7 | info | attestations | SBOM coverage increased to 85% this week | Break down attestation coverage by type |
| 8 | info | signing | 15 new artifacts signed in the last 24 hours | Summarize recent signing activity |

---

## Component Architecture

### File Structure

```
client/src/app/pages/Agent/
├── index.ts                           # Default export for lazy loading
├── Agent.tsx                          # Page component: InsightsDashboard + ChatPanel
├── components/
│   ├── InsightsDashboard.tsx          # Summary bar + insight card grid
│   ├── InsightCard.tsx                # Single insight card (severity, title, description, domain, click)
│   ├── ChatPanel.tsx                  # Message timeline + input (single conversation, no sidebar)
│   ├── ChatMessage.tsx                # Single message bubble with avatar and markdown rendering
│   ├── ChatInput.tsx                  # Text input + send button + suggested prompt chips
│   └── AgentResponseContent.tsx       # Markdown renderer for agent responses (react-markdown)

client/src/app/components/AgentTrigger/
├── AgentTrigger.tsx                   # Masthead button with badge
├── AgentPopover.tsx                   # Popover with top insights + mini chat input

client/src/app/hooks/
├── useStreamingMessage.ts             # Reusable hook: progressive text reveal with cleanup

client/src/app/queries/
├── agent.ts                           # useFetchInsights, useFetchInsightSummary, useSendChatMessage

client/src/app/queries/mocks/
├── agent.mock.ts                      # Mock insights, chat response generator
```

### Component Details

**Agent.tsx** — Page shell. Calls `useFetchInsights()` and renders `InsightsDashboard` + `ChatPanel`. Manages the connection between insight clicks and chat pre-fill via local state.

**InsightsDashboard.tsx** — Receives `AgentInsight[]`. Renders a summary bar (`Flex` with `Label` counts) and a responsive card grid (`Gallery` with `GalleryItem`). Passes an `onInsightClick(insight)` callback.

**InsightCard.tsx** — A PatternFly `Card` with `isSelectable`. Shows severity via a colored `Label`, domain as a grey `Label`, title as `CardTitle`, description as `CardBody`, timestamp in `CardFooter`. Click handler calls `onInsightClick`.

**ChatPanel.tsx** — Single-conversation layout. Messages stored in React state and synced to `localStorage` (key: `rhtas-agent-conversation`). "New conversation" button in the panel header clears messages. Calls `useSendChatMessage()` mutation on submit. Uses `useStreamingMessage()` hook for progressive text reveal. When an insight card is clicked, the panel receives the `suggestedPrompt` via props and auto-sends it as a new message (starting a new conversation if one is active).

**ChatMessage.tsx** — Renders a single message. User messages: right-aligned `div` with blue background. Agent messages: left-aligned with `RobotIcon` avatar, content rendered via `AgentResponseContent`. Shows timestamp below.

**ChatInput.tsx** — PatternFly `TextInput` with a `Button` (send icon). When conversation is empty, renders suggested prompt chips as PatternFly `Chip` components in a `ChipGroup`. Enter key or button click triggers `onSend(message)`.

**AgentResponseContent.tsx** — Wraps `react-markdown` with `remark-gfm` to render agent message content. Markdown tables render as-is via remark-gfm (no PatternFly table conversion needed for v1).

**AgentTrigger.tsx** — A `ToolbarItem` containing a `Button` with `RobotIcon`. If `totalCount > 0`, shows a PatternFly `Badge`. Click toggles `AgentPopover`. Placed in `client/src/app/layout/header.tsx` between the `NotificationBadge` and `DarkModeToggle` ToolbarItems in both desktop and mobile toolbar groups:

```tsx
{/* In header.tsx desktop toolbar group */}
<ToolbarItem>
  <NotificationBadge ... />
</ToolbarItem>
<ToolbarItem>
  <AgentTrigger />  {/* NEW */}
</ToolbarItem>
<ToolbarItem>
  <DarkModeToggle />
</ToolbarItem>
```

**AgentPopover.tsx** — PatternFly `Popover` showing a condensed list of the top 3 insights (severity icon + title, clickable). "View all" link at bottom navigates to `/agent`. A `TextInput` at the bottom navigates to `/agent?prompt={encoded}` on submit.

---

## Query Hooks

```typescript
// agent.ts

export const AgentKeys = {
  insights: ["agent", "insights"] as const,
  insightSummary: ["agent", "insights", "summary"] as const,
};

// Polls every 60 seconds
export function useFetchInsights(): {
  insights: AgentInsight[];
  isFetching: boolean;
  fetchError: Error | null;
}

// Polls every 60 seconds (lightweight, for badge)
export function useFetchInsightSummary(): {
  summary: AgentSummary;
  isFetching: boolean;
  fetchError: Error | null;
}

// Mutation — returns the full agent response; streaming is handled client-side
export function useSendChatMessage(): {
  mutate: (params: { message: string }) => void;
  data: ChatMessage | undefined;
  isPending: boolean;
  error: Error | null;
}
```

```typescript
// useStreamingMessage.ts

export function useStreamingMessage(
  content: string | undefined,
  isActive: boolean
): {
  displayedContent: string;
  isStreaming: boolean;
}
```

The `useFetchInsightSummary` hook is used by `AgentTrigger` in the masthead — it polls independently so the badge stays current even when the user isn't on the Agent page.

The `useStreamingMessage` hook encapsulates the progressive text reveal logic with proper cleanup on unmount. It uses a `useRef` internally to avoid re-render issues and clears the interval if the component unmounts mid-stream.

---

## Streaming Simulation

Agent responses simulate streaming via the `useStreamingMessage` hook:

```typescript
// In useStreamingMessage.ts
export function useStreamingMessage(content: string | undefined, isActive: boolean) {
  const [displayedContent, setDisplayedContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const intervalRef = useRef<number>();

  useEffect(() => {
    if (!content || !isActive) return;

    setIsStreaming(true);
    let index = 0;

    intervalRef.current = window.setInterval(() => {
      index += Math.floor(Math.random() * 3) + 1; // 1-3 chars at a time
      if (index >= content.length) {
        setDisplayedContent(content);
        setIsStreaming(false);
        clearInterval(intervalRef.current);
      } else {
        setDisplayedContent(content.slice(0, index));
      }
    }, 15); // ~60 chars/second

    return () => clearInterval(intervalRef.current);
  }, [content, isActive]);

  return { displayedContent, isStreaming };
}
```

**Race condition handling:** If the user sends a new message while a previous response is still streaming, the hook's cleanup fires (clearing the interval), and the new response starts fresh.

This produces a natural-feeling typing effect. When a real streaming backend is added (`/api/v1/agent/chat/stream` SSE endpoint), this hook is replaced with an SSE consumer — no other component changes needed.

---

## Dependency Additions

| Package | Purpose | Dev? |
|---------|---------|------|
| `react-markdown` | Render markdown in agent responses | No |
| `remark-gfm` | GitHub-flavored markdown (tables, strikethrough) | No |

Both are lightweight and widely used. No other new dependencies required — everything else uses existing PatternFly components and React Query.

---

## OpenAPI Spec Additions

New schemas and endpoints added to `client/openapi/console.yaml` under the `Agent` tag. The `generate` script produces TypeScript types and SDK functions. Mock implementations in `agent.mock.ts` are used when `MOCK=on`.

---

## Testing Strategy

**Unit tests:**
- `InsightCard` — renders severity, title, domain, handles click
- `ChatMessage` — renders user vs agent messages correctly
- `ChatInput` — sends on Enter/click, shows suggested prompts when empty
- `AgentResponseContent` — renders markdown tables
- `useStreamingMessage` — progressive reveal, cleanup on unmount, race condition handling
- `generateAgentResponse` — keyword routing returns relevant data, fallback returns general summary

**Integration tests:**
- `Agent.tsx` — full flow: insights render → click insight → chat input pre-fills → send → mock response streams → markdown renders
- `AgentTrigger` — badge shows correct count from `useFetchInsightSummary`, popover opens with top insights

**No E2E tests** in this iteration — the feature is mock-only and the interaction model may evolve.

---

## Future Considerations (out of scope for v1)

- **LLM backend integration:** Replace mock chat handler with real server-side LLM calls. The API contract (`/api/v1/agent/*`) is designed for drop-in replacement.
- **Multi-conversation history:** Add `ConversationList` sidebar, backend persistence, and `GET /conversations` + `GET /conversations/{id}/messages` endpoints. The API contract already defines these.
- **SSE streaming:** Replace `useStreamingMessage` hook with real SSE consumer via `/api/v1/agent/chat/stream`. Endpoint is defined in the contract.
- **Tool use:** The agent could call console APIs on behalf of the user (e.g., "verify this artifact") — requires additional authorization design.
- **Agent memory:** Cross-conversation context so the agent remembers past assessments.
- **Accessibility:** Keyboard navigation in chat, `aria-live` regions for streaming messages, screen reader announcements for new insights.
