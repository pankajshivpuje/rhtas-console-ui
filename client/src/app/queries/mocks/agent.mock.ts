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
