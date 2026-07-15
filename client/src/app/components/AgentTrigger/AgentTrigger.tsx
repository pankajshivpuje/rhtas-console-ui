import React, { useRef, useState } from "react";
import { Badge, Button } from "@patternfly/react-core";
import RobotIcon from "@patternfly/react-icons/dist/esm/icons/robot-icon";

import { useFetchInsightSummary, useFetchInsights } from "@app/queries/agent";

import { AgentPopover } from "./AgentPopover";

export const AgentTrigger: React.FC = () => {
  const { summary } = useFetchInsightSummary();
  const { insights } = useFetchInsights();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const totalCount = summary?.totalCount ?? 0;

  return (
    <>
      <Button
        ref={buttonRef}
        variant="plain"
        aria-label="Agent insights"
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
      >
        <RobotIcon />
        {totalCount > 0 && (
          <Badge isRead={false} style={{ marginLeft: "var(--pf-t--global--spacer--xs)" }}>
            {totalCount}
          </Badge>
        )}
      </Button>
      <AgentPopover
        insights={insights}
        triggerRef={buttonRef}
        isVisible={isPopoverOpen}
        onClose={() => setIsPopoverOpen(false)}
      />
    </>
  );
};
