import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Content, PageSection, Stack, StackItem } from "@patternfly/react-core";

import { DocumentMetadata } from "@app/components/DocumentMetadata";
import { LoadingWrapper } from "@app/components/LoadingWrapper";
import { useFetchInsights } from "@app/queries/agent";
import type { AgentInsight } from "@app/client";

import { InsightsDashboard } from "./components/InsightsDashboard";
import { ChatPanel } from "./components/ChatPanel";

export const Agent: React.FC = () => {
  const [searchParams] = useSearchParams();
  const promptParam = searchParams.get("prompt");

  const { insights, isFetching, fetchError } = useFetchInsights();
  const [promptToSend, setPromptToSend] = useState<string | undefined>(promptParam ?? undefined);

  const handleInsightClick = (insight: AgentInsight) => {
    setPromptToSend(insight.suggestedPrompt);
  };

  return (
    <>
      <DocumentMetadata title="Agent" />
      <PageSection>
        <Stack hasGutter>
          <StackItem>
            <Content>
              <h2>Agent</h2>
              <p>AI-powered monitoring of your signing infrastructure. Review insights and ask questions.</p>
            </Content>
          </StackItem>

          <StackItem>
            <LoadingWrapper isFetching={isFetching} fetchError={fetchError}>
              <InsightsDashboard insights={insights} onInsightClick={handleInsightClick} />
            </LoadingWrapper>
          </StackItem>

          <StackItem>
            <ChatPanel initialPrompt={promptToSend} />
          </StackItem>
        </Stack>
      </PageSection>
    </>
  );
};
