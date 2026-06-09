import type React from "react";
import { Button, Icon, Label, Split, SplitItem } from "@patternfly/react-core";
import {
  CheckCircleIcon,
  TimesCircleIcon,
  SyncAltIcon,
  ExclamationTriangleIcon,
} from "@patternfly/react-icons";
import type { TestResults } from "../types";

interface TestResultsBadgeProps {
  testResults?: TestResults;
  isValidating: boolean;
  onRunTests: () => void;
  validationError?: string | null;
}

export const TestResultsBadge: React.FC<TestResultsBadgeProps> = ({
  testResults,
  isValidating,
  onRunTests,
  validationError,
}) => {
  return (
    <div
      style={{
        padding: "var(--pf-t--global--spacer--sm) var(--pf-t--global--spacer--md)",
        borderTop: "1px solid var(--pf-t--global--border--color--default)",
        borderBottom: "1px solid var(--pf-t--global--border--color--default)",
      }}
    >
      <Split hasGutter>
        <SplitItem isFilled>
          {validationError ? (
            <Label
              color="orange"
              icon={
                <Icon>
                  <ExclamationTriangleIcon />
                </Icon>
              }
            >
              Validation unavailable
            </Label>
          ) : testResults ? (
            <Label
              color={testResults.failed === 0 ? "green" : "red"}
              icon={
                <Icon>
                  {testResults.failed === 0 ? (
                    <CheckCircleIcon />
                  ) : (
                    <TimesCircleIcon />
                  )}
                </Icon>
              }
            >
              {testResults.passed}/{testResults.passed + testResults.failed} tests passing
            </Label>
          ) : (
            <Label color="grey">No test results</Label>
          )}
        </SplitItem>
        <SplitItem>
          <Button
            variant="link"
            onClick={onRunTests}
            isDisabled={isValidating}
            isLoading={isValidating}
            icon={<SyncAltIcon />}
            size="sm"
          >
            Run tests
          </Button>
        </SplitItem>
      </Split>
    </div>
  );
};
