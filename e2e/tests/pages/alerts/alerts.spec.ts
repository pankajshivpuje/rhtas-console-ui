import { expect } from "../../assertions";
import { test } from "../../fixtures";
import { Navigation } from "../../common/Navigation";

import { AlertsPage } from "./AlertsPage";
import { setupAlertRoutes, alertsApiResponse } from "./alert-fixtures";

test.describe("Alerts", () => {
  test.beforeEach(async ({ page }) => {
    await setupAlertRoutes(page);
  });

  test("Navigation: sidebar link navigates to alerts page", async ({ page }) => {
    const nav = Navigation.build(page);
    await nav.goToSidebar("Alerts");
  });

  test("Page renders with heading and table", async ({ page }) => {
    const alertsPage = await AlertsPage.build(page);
    const table = await alertsPage.getTable();

    await expect(table._table).toBeVisible();
  });

  test("Default filter shows only firing alerts", async ({ page }) => {
    const alertsPage = await AlertsPage.build(page);
    const table = await alertsPage.getTable();

    const statusCells = await table.getColumn("Status");
    const statuses = await statusCells.allInnerTexts();

    for (const status of statuses) {
      expect(status).toContain("Firing");
    }
  });

  test("Table displays expected columns", async ({ page }) => {
    const alertsPage = await AlertsPage.build(page);
    const table = await alertsPage.getTable();

    for (const column of ["Severity", "Alert Name", "Summary", "Status", "Started", "Actions"]) {
      await expect(table._table.getByRole("columnheader", { name: column })).toBeVisible();
    }
  });

  test("Table shows alert data from API", async ({ page }) => {
    const alertsPage = await AlertsPage.build(page);
    const table = await alertsPage.getTable();

    const firingAlerts = alertsApiResponse.data.filter((a) => a.status === "firing");

    const alertNameCells = await table.getColumn("Alert Name");
    const names = await alertNameCells.allInnerTexts();
    expect(names.length).toBe(firingAlerts.length);

    await expect(table).toHaveColumnWithValue("Alert Name", "RHTASComponentDown");
    await expect(table).toHaveColumnWithValue("Severity", "Critical");
  });

  test("Severity sorted: critical first, then warning, then info", async ({ page }) => {
    const alertsPage = await AlertsPage.build(page);
    const table = await alertsPage.getTable();

    const severityCells = await table.getColumn("Severity");
    const severities = await severityCells.allInnerTexts();

    const severityOrder = severities.map((s) => {
      if (s.includes("Critical")) return 0;
      if (s.includes("Warning")) return 1;
      if (s.includes("Info")) return 2;
      return 3;
    });

    for (let i = 1; i < severityOrder.length; i++) {
      expect(severityOrder[i]).toBeGreaterThanOrEqual(severityOrder[i - 1]);
    }
  });

  test("Clear all filters shows resolved alerts", async ({ page }) => {
    const alertsPage = await AlertsPage.build(page);
    await alertsPage.clearAllFilters();

    const table = await alertsPage.getTable();
    await expect(table).toHaveColumnWithValue("Status", "Resolved");
    await expect(table).toHaveColumnWithValue("Alert Name", "RHTASVerificationFailureSpike");
  });

  test("Filter by severity: critical only", async ({ page }) => {
    const alertsPage = await AlertsPage.build(page);
    await alertsPage.selectFilterOption("Filter by severity", "Critical");

    const table = await alertsPage.getTable();
    const severityCells = await table.getColumn("Severity");
    const severities = await severityCells.allInnerTexts();

    for (const sev of severities) {
      expect(sev).toContain("Critical");
    }
  });

  test("Acknowledge button is visible for unacknowledged alerts", async ({ page }) => {
    const alertsPage = await AlertsPage.build(page);

    await expect(page.getByRole("button", { name: "Acknowledge" }).first()).toBeVisible();
  });

  test("Acknowledge button click updates alert state", async ({ page }) => {
    const alertsPage = await AlertsPage.build(page);

    const ackButton = page.getByRole("button", { name: "Acknowledge" }).first();
    await ackButton.click();

    await expect(page.getByText(/Acknowledged/).first()).toBeVisible();
  });

  test("Pagination renders", async ({ page }) => {
    const alertsPage = await AlertsPage.build(page);
    const pagination = await alertsPage.getPagination();
    await expect(pagination).toBeFirstPage();
  });
});

test.describe("Alerts - Banner", () => {
  test.beforeEach(async ({ page }) => {
    await setupAlertRoutes(page);
  });

  test("Critical alert banner appears on non-alerts pages", async ({ page }) => {
    await page.goto("/");

    const bannerAlert = page.locator("[aria-live='polite']").getByText("TAS component rekor is down");
    await expect(bannerAlert).toBeVisible();
  });

  test("Banner dismiss hides the alert", async ({ page }) => {
    await page.goto("/");

    const alertGroup = page.locator("[aria-live='polite']");
    const closeButton = alertGroup.getByRole("button", { name: "Close" }).first();
    await closeButton.click();

    await expect(alertGroup.getByText("TAS component rekor is down")).not.toBeVisible();
  });
});

test.describe("Alerts - Notification Badge", () => {
  test.beforeEach(async ({ page }) => {
    await setupAlertRoutes(page);
  });

  test("Notification badge shows unacknowledged count", async ({ page }) => {
    await page.goto("/");

    const badge = page.getByRole("button", { name: "Notifications" });
    await expect(badge).toBeVisible();
    await expect(badge).toContainText("3");
  });

  test("Notification badge click navigates to alerts page", async ({ page }) => {
    await page.goto("/");

    const badge = page.getByRole("button", { name: "Notifications" });
    await badge.click();

    await expect(page.getByRole("heading", { level: 1, name: "Alerts" })).toBeVisible();
  });
});
