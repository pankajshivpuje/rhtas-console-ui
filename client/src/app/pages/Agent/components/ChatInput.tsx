import React, { useState } from "react";
import { Button, Flex, FlexItem, TextInput } from "@patternfly/react-core";
import { Chip, ChipGroup } from "@patternfly/react-core/deprecated";
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
            <div key={prompt} onClick={() => onSend(prompt)} style={{ display: "inline-block", cursor: "pointer" }}>
              <Chip component="button">
                {prompt}
              </Chip>
            </div>
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
