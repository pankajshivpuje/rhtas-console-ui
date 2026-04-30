import { runA11yAudit } from "../../common/a11y";
import { test } from "../../fixtures";

import { AlertsPage } from "./AlertsPage";
import { setupAlertRoutes } from "./alert-fixtures";

test.describe("Alerts - Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await setupAlertRoutes(page);
  });

  test("Page view: default (firing alerts)", async ({ page }, testInfo) => {
    await AlertsPage.build(page);
    await runA11yAudit(page, testInfo, { label: "alerts-default" });
  });

  test("Page view: all alerts (no filter)", async ({ page }, testInfo) => {
    const alertsPage = await AlertsPage.build(page);
    await alertsPage.clearAllFilters();
    await runA11yAudit(page, testInfo, { label: "alerts-all" });
  });
});
