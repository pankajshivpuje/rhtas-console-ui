import type React from "react";
import { useState } from "react";
import {
  Button,
  TextArea,
  ToggleGroup,
  ToggleGroupItem,
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
        backgroundColor:
          "var(--pf-t--global--background--color--primary--default)",
      }}
    >
      <ToggleGroup isCompact aria-label="Policy type filter">
        {POLICY_TYPE_OPTIONS.map((opt) => (
          <ToggleGroupItem
            key={opt.value}
            text={opt.label}
            buttonId={`policy-type-${opt.value}`}
            isSelected={policyTypeFilter === opt.value}
            onChange={() => onPolicyTypeChange(opt.value)}
          />
        ))}
      </ToggleGroup>

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
          alignItems: "flex-end",
        }}
      >
        <TextArea
          value={message}
          onChange={(_event, val) => setMessage(val)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your policy requirements... (Enter to send)"
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
          iconPosition="end"
          aria-label="Send message"
        >
          Send
        </Button>
      </div>
    </div>
  );
};
