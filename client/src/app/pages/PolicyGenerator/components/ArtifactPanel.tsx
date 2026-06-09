import type React from "react";
import { useState } from "react";
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  Tab,
  Tabs,
  TabTitleText,
  Title,
  MenuToggle,
  Select,
  SelectOption,
  Split,
  SplitItem,
} from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";
import type { PolicyArtifacts } from "../types";
import { ArtifactCodeView } from "./ArtifactCodeView";
import { TestResultsBadge } from "./TestResultsBadge";
import { ArtifactActions } from "./ArtifactActions";

type TabKey = "rule" | "tests" | "config" | "data" | "command";

interface ArtifactPanelProps {
  artifacts: PolicyArtifacts | null;
  artifactHistory: PolicyArtifacts[];
  isValidating: boolean;
  onRunTests: () => void;
  validationError?: string | null;
}

export const ArtifactPanel: React.FC<ArtifactPanelProps> = ({
  artifacts,
  artifactHistory,
  isValidating,
  onRunTests,
  validationError,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>("rule");
  const [viewingVersion, setViewingVersion] = useState<number | null>(null);
  const [versionSelectOpen, setVersionSelectOpen] = useState(false);

  if (!artifacts) {
    return (
      <Bullseye style={{ height: "100%" }}>
        <EmptyState icon={CubesIcon}>
          <EmptyStateBody>
            Generated artifacts will appear here once you describe your policy
            requirements in the chat.
          </EmptyStateBody>
        </EmptyState>
      </Bullseye>
    );
  }

  const displayedArtifacts =
    viewingVersion !== null
      ? artifactHistory.find((a) => a.version === viewingVersion) ?? artifacts
      : artifacts;

  const getTabContent = (): { content: string; filename: string } => {
    switch (activeTab) {
      case "rule":
        return { content: displayedArtifacts.rule.content, filename: displayedArtifacts.rule.filename };
      case "tests":
        return { content: displayedArtifacts.tests.content, filename: displayedArtifacts.tests.filename };
      case "config":
        return { content: displayedArtifacts.config.content, filename: displayedArtifacts.config.filename };
      case "data":
        return displayedArtifacts.data
          ? { content: displayedArtifacts.data.content, filename: displayedArtifacts.data.filename }
          : { content: "No data file generated", filename: "none" };
      case "command":
        return { content: displayedArtifacts.command, filename: "command.sh" };
    }
  };

  const { content, filename } = getTabContent();
  const totalVersions = artifactHistory.length + 1;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderLeft: "1px solid var(--pf-t--global--border--color--default)",
      }}
    >
      <div
        style={{
          padding: "var(--pf-t--global--spacer--sm) var(--pf-t--global--spacer--md)",
          borderBottom: "1px solid var(--pf-t--global--border--color--default)",
        }}
      >
        <Split hasGutter>
          <SplitItem isFilled>
            <Title headingLevel="h3" size="md">
              Artifacts
            </Title>
          </SplitItem>
          {totalVersions > 1 && (
            <SplitItem>
              <Select
                isOpen={versionSelectOpen}
                onOpenChange={setVersionSelectOpen}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setVersionSelectOpen(!versionSelectOpen)}
                    isExpanded={versionSelectOpen}
                    style={{ minWidth: "80px" }}
                  >
                    v{viewingVersion ?? artifacts.version}
                  </MenuToggle>
                )}
                onSelect={(_event, value) => {
                  const v = Number(value);
                  setViewingVersion(v === artifacts.version ? null : v);
                  setVersionSelectOpen(false);
                }}
                selected={String(viewingVersion ?? artifacts.version)}
              >
                {[...artifactHistory, artifacts].map((a) => (
                  <SelectOption key={a.version} value={String(a.version)}>
                    v{a.version}
                    {a.version === artifacts.version ? " (latest)" : ""}
                  </SelectOption>
                ))}
              </Select>
            </SplitItem>
          )}
        </Split>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(_event, key) => setActiveTab(key as TabKey)}
        isFilled
      >
        <Tab
          eventKey="rule"
          title={<TabTitleText>{displayedArtifacts.rule.filename}</TabTitleText>}
        />
        <Tab
          eventKey="tests"
          title={<TabTitleText>{displayedArtifacts.tests.filename}</TabTitleText>}
        />
        <Tab
          eventKey="config"
          title={<TabTitleText>{displayedArtifacts.config.filename}</TabTitleText>}
        />
        {displayedArtifacts.data && (
          <Tab
            eventKey="data"
            title={<TabTitleText>{displayedArtifacts.data.filename}</TabTitleText>}
          />
        )}
        <Tab eventKey="command" title={<TabTitleText>Command</TabTitleText>} />
      </Tabs>

      <ArtifactCodeView content={content} filename={filename} />

      <TestResultsBadge
        testResults={displayedArtifacts.testResults}
        isValidating={isValidating}
        onRunTests={onRunTests}
        validationError={validationError}
      />

      <ArtifactActions artifacts={displayedArtifacts} activeTabContent={content} />
    </div>
  );
};
