import type { ConformaResult } from "@app/pages/Conforma/types";

export const mockConformaResult: ConformaResult = {
  success: false,
  components: [
    {
      name: "my-app",
      containerImage: "quay.io/my-org/my-app:v1.2.3@sha256:abc123",
      success: false,
      violations: [
        {
          metadata: {
            title: "Builder ID must be pinned",
            description:
              "Validates that the builder.id in the SLSA provenance attestation matches a trusted builder identity.",
            collections: ["slsa3"],
            code: "builtin.attestation.task.slsa_build_l3.builder_id",
            solution:
              "Ensure your build pipeline uses a trusted builder. Configure the allowed builder IDs in the policy data.",
          },
          msg: "Builder ID 'https://untrusted.example.com/builder' is not in the list of trusted builders",
        },
        {
          metadata: {
            title: "Source repository must match allowed pattern",
            description:
              "Ensures the source repository URI in the SLSA provenance matches the organization's allowed source patterns.",
            collections: ["slsa3"],
            code: "builtin.attestation.task.slsa_build_l3.source_correlated",
          },
          msg: "Source repository 'git+https://github.com/unknown-org/app.git' does not match allowed pattern",
        },
      ],
      warnings: [
        {
          metadata: {
            title: "SBOM contains deprecated package format",
            description:
              "The SBOM attestation references packages using a deprecated identifier format.",
            collections: ["sbom"],
            code: "builtin.attestation.sbom.deprecated_format",
            effective_on: "2026-09-01T00:00:00Z",
          },
          msg: "Package 'golang.org/x/crypto' uses deprecated purl format. Migrate to pkg:golang format.",
        },
      ],
      successes: [
        {
          metadata: {
            title: "Hermetic build enforcement",
            description:
              "Verifies that the build was executed in a hermetic environment with no network access.",
            collections: ["slsa3"],
            code: "builtin.attestation.task.slsa_build_l3.hermetic",
          },
          msg: "Build is hermetic",
        },
        {
          metadata: {
            title: "SLSA provenance predicate type",
            description:
              "Validates that the attestation predicate type matches https://slsa.dev/provenance/v1.",
            collections: ["slsa3"],
            code: "builtin.attestation.task.slsa_build_l3.predicate_type",
          },
          msg: "Predicate type is valid",
        },
        {
          metadata: {
            title: "SBOM package sources validated",
            description:
              "All packages in the SBOM originate from approved source repositories.",
            collections: ["sbom"],
            code: "builtin.attestation.sbom.allowed_sources",
          },
          msg: "All 47 packages from approved sources",
        },
        {
          metadata: {
            title: "Signature verified",
            description: "The image signature was cryptographically verified.",
            collections: ["minimal"],
            code: "builtin.image.signature_verified",
          },
          msg: "Signature verified against provided public key",
        },
      ],
    },
  ],
};
