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
