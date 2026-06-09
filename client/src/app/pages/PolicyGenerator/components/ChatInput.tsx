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
