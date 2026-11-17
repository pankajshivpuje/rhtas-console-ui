import { FormSelect, FormSelectOption } from "@patternfly/react-core";

import ENV from "@app/env";
import { useMockHealth, type MockHealthScenario } from "./mockHealthContext";

export const MockHealthControls = () => {
  const { scenario, setScenario } = useMockHealth();

  if (ENV.MOCK === "off") return null;

  return (
    <div
      role="group"
      aria-label="Mockup controls"
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "var(--pf-t--global--spacer--sm)",
        padding: "var(--pf-t--global--spacer--xs) var(--pf-t--global--spacer--sm)",
        background: "var(--pf-t--global--background--color--secondary--default)",
        borderBottom: "1px solid var(--pf-t--global--border--color--default)",
      }}
    >
      <label htmlFor="mock-health-scenario" style={{ whiteSpace: "nowrap" }}>
        System health
      </label>
      <FormSelect
        id="mock-health-scenario"
        className="mock-health-select"
        value={scenario}
        onChange={(_event, value) => setScenario(value as MockHealthScenario)}
        style={{ width: "auto" }}
      >
        <FormSelectOption value="healthy" label="Healthy" />
        <FormSelectOption value="degraded" label="Degraded" />
        <FormSelectOption value="down" label="Down" />
      </FormSelect>
    </div>
  );
};
