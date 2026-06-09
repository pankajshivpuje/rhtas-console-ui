import type {
  ChatMessage,
  PolicySession,
  GenerateResponse,
  ValidateResponse,
  PolicyArtifacts,
} from "@app/pages/PolicyGenerator/types";

const regoRuleContent = `package policy.slsa_provenance

import rego.v1

# title: SLSA Provenance Builder and Source Verification
# description: Validates SLSA provenance attestations against trusted builder identities,
# source repository patterns, and hermetic build requirements.

# Deny if builder identity is not in the allowed list
deny contains msg if {
  some att in input.attestations
  att.type == "https://slsa.dev/provenance/v1"
  builder_id := att.predicate.buildDefinition.builderId
  not builder_id in data.allowed_builders
  msg := sprintf("Untrusted builder: %s", [builder_id])
}

# Deny if source repository does not match allowed pattern
deny contains msg if {
  some att in input.attestations
  att.type == "https://slsa.dev/provenance/v1"
  source_uri := att.predicate.buildDefinition.externalParameters.source.uri
  not regex.match(data.allowed_source_pattern, source_uri)
  msg := sprintf("Source repository not allowed: %s", [source_uri])
}

# Deny if hermetic build flag is not enabled
deny contains msg if {
  some att in input.attestations
  att.type == "https://slsa.dev/provenance/v1"
  hermetic := att.predicate.buildDefinition.resolvedDependencies[_].annotations["hermetic"]
  hermetic != "true"
  msg := "Build is not hermetic: hermetic flag must be set to true"
}
`;

const testContent = `package policy.slsa_provenance_test

import rego.v1
import data.policy.slsa_provenance

test_valid_provenance_passes if {
  result := slsa_provenance.deny with input as {
    "attestations": [{
      "type": "https://slsa.dev/provenance/v1",
      "predicate": {
        "buildDefinition": {
          "builderId": "https://tekton.dev/chains/v2",
          "externalParameters": {
            "source": {
              "uri": "git+https://github.com/trusted-org/my-app.git"
            }
          },
          "resolvedDependencies": [{
            "annotations": {
              "hermetic": "true"
            }
          }]
        }
      }
    }]
  } with data.allowed_builders as ["https://tekton.dev/chains/v2"] with data.allowed_source_pattern as "^git\\+https://github\\.com/trusted-org/.*"

  count(result) == 0
}

test_untrusted_builder_denies if {
  result := slsa_provenance.deny with input as {
    "attestations": [{
      "type": "https://slsa.dev/provenance/v1",
      "predicate": {
        "buildDefinition": {
          "builderId": "https://untrusted.example.com/builder",
          "externalParameters": {
            "source": {
              "uri": "git+https://github.com/trusted-org/my-app.git"
            }
          },
          "resolvedDependencies": [{
            "annotations": {
              "hermetic": "true"
            }
          }]
        }
      }
    }]
  } with data.allowed_builders as ["https://tekton.dev/chains/v2"] with data.allowed_source_pattern as "^git\\+https://github\\.com/trusted-org/.*"

  count(result) > 0
}

test_non_hermetic_build_denies if {
  result := slsa_provenance.deny with input as {
    "attestations": [{
      "type": "https://slsa.dev/provenance/v1",
      "predicate": {
        "buildDefinition": {
          "builderId": "https://tekton.dev/chains/v2",
          "externalParameters": {
            "source": {
              "uri": "git+https://github.com/trusted-org/my-app.git"
            }
          },
          "resolvedDependencies": [{
            "annotations": {
              "hermetic": "false"
            }
          }]
        }
      }
    }]
  } with data.allowed_builders as ["https://tekton.dev/chains/v2"] with data.allowed_source_pattern as "^git\\+https://github\\.com/trusted-org/.*"

  count(result) > 0
}
`;

const configContent = `# Enterprise Container Signing Configuration
version: v1beta1

sources:
  - name: slsa-provenance-policy
    policy:
      - oci::quay.io/my-org/policies/slsa-provenance
    data:
      - oci::quay.io/my-org/policies/slsa-data
    publicKey: |
      -----BEGIN PUBLIC KEY-----
      MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
      -----END PUBLIC KEY-----
    regoModules:
      - policy.slsa_provenance
`;

const dataContent = `{
  "allowed_builders": [
    "https://tekton.dev/chains/v2"
  ],
  "allowed_source_pattern": "^git\\\\+https://github\\\\.com/trusted-org/.*"
}
`;

const commandContent = `ec validate image \\
  --image quay.io/my-org/my-app:v1.2.3 \\
  --policy slsa-provenance-policy \\
  --public-key cosign.pub \\
  --output json`;

const artifacts: PolicyArtifacts = {
  rule: {
    filename: "slsa_provenance.rego",
    content: regoRuleContent,
  },
  tests: {
    filename: "slsa_provenance_test.rego",
    content: testContent,
  },
  config: {
    filename: "policy.yaml",
    content: configContent,
  },
  data: {
    filename: "data.json",
    content: dataContent,
  },
  command: commandContent,
  version: 1,
  testResults: {
    passed: 3,
    failed: 0,
    results: [
      { name: "test_valid_provenance_passes", status: "pass" },
      { name: "test_untrusted_builder_denies", status: "pass" },
      { name: "test_non_hermetic_build_denies", status: "pass" },
    ],
  },
};

export const mockMessages: ChatMessage[] = [
  {
    id: "msg-1",
    role: "assistant",
    content:
      "Welcome to the Policy Generator. I can help you create Rego policies for SLSA provenance and SBOM attestations. What would you like to enforce?",
    timestamp: "2026-06-08T10:00:00Z",
  },
  {
    id: "msg-2",
    role: "user",
    content:
      "Create a SLSA provenance policy that validates the Tekton builder ID, enforces that source repositories match our GitHub org pattern (trusted-org), and requires hermetic builds.",
    timestamp: "2026-06-08T10:01:15Z",
  },
  {
    id: "msg-3",
    role: "assistant",
    content:
      "I've generated a SLSA provenance policy with three enforcement rules:\n\n1. **Builder Identity Validation**: Only allows attestations from `https://tekton.dev/chains/v2`\n2. **Source Repository Pattern**: Enforces that source URIs match `^git\\+https://github\\.com/trusted-org/.*`\n3. **Hermetic Build Requirement**: Denies builds that don't have the hermetic annotation set to true\n\nThe policy uses Rego v1 syntax with externalized data for the allowed builders and source patterns. I've also included comprehensive tests that validate both passing and failing scenarios.",
    artifacts,
    timestamp: "2026-06-08T10:01:45Z",
  },
];

export const mockSession: PolicySession = {
  id: "session-abc123",
  messages: mockMessages,
  currentArtifacts: artifacts,
  artifactHistory: [],
  policyTypeFilter: "slsa",
  createdAt: "2026-06-08T10:00:00Z",
  title: "SLSA Provenance Validation Policy",
};

export const mockGenerateResponse: GenerateResponse = {
  sessionId: "session-abc123",
  reply:
    "I've generated a SLSA provenance policy with three enforcement rules:\n\n1. **Builder Identity Validation**: Only allows attestations from `https://tekton.dev/chains/v2`\n2. **Source Repository Pattern**: Enforces that source URIs match `^git\\+https://github\\.com/trusted-org/.*`\n3. **Hermetic Build Requirement**: Denies builds that don't have the hermetic annotation set to true\n\nThe policy uses Rego v1 syntax with externalized data for the allowed builders and source patterns. I've also included comprehensive tests that validate both passing and failing scenarios.",
  artifacts: {
    rule: {
      filename: "slsa_provenance.rego",
      content: regoRuleContent,
    },
    tests: {
      filename: "slsa_provenance_test.rego",
      content: testContent,
    },
    config: {
      filename: "policy.yaml",
      content: configContent,
    },
    data: {
      filename: "data.json",
      content: dataContent,
    },
    command: commandContent,
  },
  policyMeta: {
    types: ["slsa"],
    version: 1,
  },
};

export const mockValidateResponse: ValidateResponse = {
  passed: 3,
  failed: 0,
  results: [
    { name: "test_valid_provenance_passes", status: "pass" },
    { name: "test_untrusted_builder_denies", status: "pass" },
    { name: "test_non_hermetic_build_denies", status: "pass" },
  ],
};
