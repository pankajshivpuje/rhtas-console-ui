import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Content, Flex, FlexItem, PageSection } from "@patternfly/react-core";

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
      <DocumentMetadata title="Ask agent" />
      <PageSection>
        <Content style={{ marginBottom: "var(--pf-t--global--spacer--md)" }}>
          <h2>Ask agent</h2>
          <p>AI-powered monitoring of your signing infrastructure. Review insights and ask questions.</p>
        </Content>

        <Flex
          direction={{ default: "column", lg: "row" }}
          alignItems={{ default: "alignItemsStretch" }}
          gap={{ default: "gapMd" }}
        >
          <FlexItem flex={{ default: "flex_2" }}>
            <LoadingWrapper isFetching={isFetching} fetchError={fetchError}>
              <InsightsDashboard insights={insights} onInsightClick={handleInsightClick} />
            </LoadingWrapper>
          </FlexItem>

          <FlexItem flex={{ default: "flex_1" }} style={{ position: "sticky", top: 0, alignSelf: "flex-start", minHeight: "calc(100vh - 150px)" }}>
            <ChatPanel initialPrompt={promptToSend} />
          </FlexItem>
        </Flex>
      </PageSection>
    </>
  );
};
