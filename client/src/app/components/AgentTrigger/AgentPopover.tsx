import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Flex,
  FlexItem,
  Label,
  Popover,
  TextInput,
} from "@patternfly/react-core";
import { ExclamationCircleIcon, ExclamationTriangleIcon, InfoCircleIcon } from "@patternfly/react-icons";

import type { AgentInsight } from "@app/client";
import { Paths } from "@app/Routes";

interface AgentPopoverProps {
  insights: AgentInsight[];
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  isVisible: boolean;
  onClose: () => void;
}

const severityIcons = {
  critical: <ExclamationCircleIcon color="var(--pf-t--global--icon--color--severity--critical--default)" />,
  warning: <ExclamationTriangleIcon color="var(--pf-t--global--icon--color--severity--warning--default)" />,
  info: <InfoCircleIcon color="var(--pf-t--global--icon--color--severity--info--default)" />,
};

export const AgentPopover: React.FC<AgentPopoverProps> = ({
  insights,
  triggerRef,
  isVisible,
  onClose,
}) => {
  const navigate = useNavigate();
  const [quickPrompt, setQuickPrompt] = useState("");
  const topInsights = insights.slice(0, 3);

  const handleQuickPromptSend = () => {
    if (!quickPrompt.trim()) return;
    navigate(`${Paths.agent}?prompt=${encodeURIComponent(quickPrompt.trim())}`);
    onClose();
  };

  return (
    <Popover
      isVisible={isVisible}
      shouldClose={onClose}
      triggerRef={triggerRef}
      headerContent="Agent Insights"
      bodyContent={
        <div>
          {topInsights.length > 0 ? (
            topInsights.map((insight) => (
              <Flex
                key={insight.id}
                gap={{ default: "gapSm" }}
                alignItems={{ default: "alignItemsCenter" }}
                style={{ padding: "var(--pf-t--global--spacer--xs) 0", cursor: "pointer" }}
                onClick={() => {
                  navigate(`${Paths.agent}?prompt=${encodeURIComponent(insight.suggestedPrompt)}`);
                  onClose();
                }}
              >
                <FlexItem>{severityIcons[insight.severity]}</FlexItem>
                <FlexItem>{insight.title}</FlexItem>
              </Flex>
            ))
          ) : (
            <p>No issues detected.</p>
          )}
        </div>
      }
      footerContent={
        <div style={{ width: "100%" }}>
          <Button variant="link" onClick={() => { navigate(Paths.agent); onClose(); }} style={{ marginBottom: "var(--pf-t--global--spacer--sm)" }}>
            View all insights
          </Button>
          <Flex>
            <FlexItem flex={{ default: "flex_1" }}>
              <TextInput
                type="text"
                value={quickPrompt}
                onChange={(_e, val) => setQuickPrompt(val)}
                onKeyDown={(e) => e.key === "Enter" && handleQuickPromptSend()}
                placeholder="Ask the agent..."
                aria-label="Quick agent prompt"
              />
            </FlexItem>
          </Flex>
        </div>
      }
    />
  );
};
