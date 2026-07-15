import { expect, type Page } from "@playwright/test";
import { Table } from "../../common/Table";
import { Pagination } from "../../common/Pagination";

export class AlertsPage {
  private readonly _page: Page;

  private constructor(page: Page) {
    this._page = page;
  }

  static async build(page: Page) {
    await page.goto("/alerts");
    await expect(page.getByRole("heading", { level: 1, name: "Alerts" })).toBeVisible();
    return new AlertsPage(page);
  }

  async getTable() {
    return await Table.build(
      this._page,
      "Alerts table",
      {
        Severity: { isSortable: false },
        "Alert Name": { isSortable: false },
        Summary: { isSortable: false },
        Status: { isSortable: false },
        Started: { isSortable: false },
        Actions: { isSortable: false },
      },
      [] as const
    );
  }

  async getPagination(top = true) {
    return await Pagination.build(this._page, `alerts-table-pagination-${top ? "top" : "bottom"}`);
  }

  async selectFilterOption(placeholderText: string, option: string) {
    const toggle = this._page.locator(`input[placeholder="${placeholderText}"]`);
    await toggle.click();
    await toggle.fill(option);

    const dropdownOption = this._page.getByRole("menuitem", { name: option, exact: true });
    await expect(dropdownOption).toBeVisible();
    await dropdownOption.click();
  }

  async clearAllFilters() {
    await this._page.getByRole("button", { name: "Clear all filters" }).click();
  }
}
