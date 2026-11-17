import { useState, type ReactNode } from "react";

import { MockHealthContext, type MockHealthScenario } from "./mockHealthContext";

export const MockHealthProvider = ({ children }: { children: ReactNode }) => {
  const [scenario, setScenario] = useState<MockHealthScenario>("down");
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Record<string, string>>({});
  const acknowledgeAlert = (id: string, acknowledgedAt: string) =>
    setAcknowledgedAlerts((previous) => ({ ...previous, [id]: acknowledgedAt }));
  return (
    <MockHealthContext.Provider value={{ scenario, setScenario, acknowledgedAlerts, acknowledgeAlert }}>
      {children}
    </MockHealthContext.Provider>
  );
};
