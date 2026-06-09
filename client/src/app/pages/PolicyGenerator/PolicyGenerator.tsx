import type React from "react";
import { useCallback, useState } from "react";
import {
  Button,
  Content,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  PageSection,
  Split,
  SplitItem,
} from "@patternfly/react-core";
import { PlusCircleIcon, HistoryIcon, AngleRightIcon, AngleLeftIcon } from "@patternfly/react-icons";
import { DocumentMetadata } from "@app/components/DocumentMetadata";
import { usePolicyGenerate, usePolicyValidate } from "@app/queries/policies";
import { usePolicySession } from "./usePolicySession";
import { ChatPanel } from "./components/ChatPanel";
import { ArtifactPanel } from "./components/ArtifactPanel";
import type { ChatMessage, PolicyArtifacts, VerificationContext } from "./types";

export const PolicyGenerator: React.FC = () => {
  const {
    session,
    sessions,
    appendMessage,
    setArtifacts,
    setPolicyTypeFilter,
    newSession,
    loadSession,
  } = usePolicySession();

  const { generate, isGenerating, error: generateError, reset: resetGenerate } = usePolicyGenerate();
  const { validate, isValidating, error: validateError } = usePolicyValidate();

  const [historyOpen, setHistoryOpen] = useState(false);
  const [artifactsCollapsed, setArtifactsCollapsed] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const handleSendMessage = useCallback(
    async (
      message: string,
      options: { imageRef?: string; verification?: VerificationContext },
    ) => {
      setChatError(null);
      resetGenerate();

      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      };
      appendMessage(userMsg);

      try {
        const history = session.messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await generate({
          sessionId: session.id,
          message,
          history,
          context: {
            imageRef: options.imageRef,
            policyTypes: [session.policyTypeFilter],
            verification: options.verification,
          },
        });

        const nextVersion = session.currentArtifacts
          ? session.currentArtifacts.version + 1
          : 1;

        const artifacts: PolicyArtifacts | undefined = response.artifacts
          ? {
              rule: response.artifacts.rule,
              tests: response.artifacts.tests,
              config: response.artifacts.config,
              data: response.artifacts.data,
              command: response.artifacts.command,
              version: nextVersion,
            }
          : undefined;

        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: response.reply,
          artifacts,
          timestamp: new Date().toISOString(),
        };
        appendMessage(assistantMsg);

        if (artifacts) {
          setArtifacts(artifacts);
        }
      } catch {
        setChatError(
          "Failed to reach the policy service. Check your connection and try again.",
        );
      }
    },
    [session, appendMessage, generate, setArtifacts, resetGenerate],
  );

  const handleRunTests = useCallback(async () => {
    if (!session.currentArtifacts) return;

    try {
      const result = await validate({
        rule: session.currentArtifacts.rule.content,
        tests: session.currentArtifacts.tests.content,
      });

      setArtifacts({
        ...session.currentArtifacts,
        testResults: result,
      });
    } catch {
      // TestResultsBadge handles the error via validationError prop
    }
  }, [session.currentArtifacts, validate, setArtifacts]);

  return (
    <>
      <DocumentMetadata title="Conforma Policy Generator" />
      <PageSection variant="default">
        <Split>
          <SplitItem isFilled>
            <Content>
              <h1>Conforma Policy Generator</h1>
              <p>
                AI-assisted Conforma policy generation for SBOM and SLSA
                provenance
              </p>
            </Content>
          </SplitItem>
          <SplitItem>
            <Split hasGutter>
              <SplitItem>
                <Button
                  variant="secondary"
                  icon={<PlusCircleIcon />}
                  onClick={newSession}
                >
                  New Session
                </Button>
              </SplitItem>
              <SplitItem>
                <Dropdown
                  isOpen={historyOpen}
                  onOpenChange={setHistoryOpen}
                  toggle={(toggleRef) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setHistoryOpen(!historyOpen)}
                      isExpanded={historyOpen}
                      icon={<HistoryIcon />}
                    >
                      History
                    </MenuToggle>
                  )}
                >
                  <DropdownList>
                    {sessions.map((s) => (
                      <DropdownItem
                        key={s.id}
                        onClick={() => {
                          loadSession(s.id);
                          setHistoryOpen(false);
                        }}
                        description={`${s.messageCount} messages`}
                        isDisabled={s.id === session.id}
                      >
                        {s.title}
                      </DropdownItem>
                    ))}
                  </DropdownList>
                </Dropdown>
              </SplitItem>
            </Split>
          </SplitItem>
        </Split>
      </PageSection>

      <PageSection isFilled padding={{ default: "noPadding" }}>
        <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <ChatPanel
              messages={session.messages}
              isGenerating={isGenerating}
              policyTypeFilter={session.policyTypeFilter}
              onPolicyTypeChange={setPolicyTypeFilter}
              onSendMessage={handleSendMessage}
              error={chatError ?? (generateError ? generateError.message : null)}
              onRetry={() => setChatError(null)}
            />
          </div>
          <Button
            variant="plain"
            onClick={() => setArtifactsCollapsed(!artifactsCollapsed)}
            aria-label={artifactsCollapsed ? "Show artifacts" : "Hide artifacts"}
            style={{
              borderLeft: "1px solid var(--pf-t--global--border--color--default)",
              borderRadius: 0,
              padding: "0 var(--pf-t--global--spacer--xs)",
              flexShrink: 0,
            }}
          >
            {artifactsCollapsed ? <AngleLeftIcon /> : <AngleRightIcon />}
          </Button>
          {!artifactsCollapsed && (
            <div style={{ flex: "0 0 40%", minWidth: 320, maxWidth: 600, minHeight: 0 }}>
              <ArtifactPanel
                artifacts={session.currentArtifacts}
                artifactHistory={session.artifactHistory}
                isValidating={isValidating}
                onRunTests={handleRunTests}
                validationError={validateError ? "Validation unavailable" : null}
              />
            </div>
          )}
        </div>
      </PageSection>
    </>
  );
};
