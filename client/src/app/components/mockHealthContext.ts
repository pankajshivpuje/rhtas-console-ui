import { createContext, useContext } from "react";

export type MockHealthScenario = "healthy" | "degraded" | "down";

export const MockHealthContext = createContext<{
  scenario: MockHealthScenario;
  setScenario: (scenario: MockHealthScenario) => void;
  acknowledgedAlerts: Record<string, string>;
  acknowledgeAlert: (id: string, acknowledgedAt: string) => void;
}>({ scenario: "down", setScenario: () => {}, acknowledgedAlerts: {}, acknowledgeAlert: () => {} });

export const useMockHealth = () => useContext(MockHealthContext);
