import type { Page } from "playwright-core";
import { expect } from "../assertions";

/**
 * Used to navigate to different pages
 */
export class Navigation {
  private readonly _page: Page;

  private constructor(page: Page) {
    this._page = page;
  }

  static build(page: Page) {
    return new Navigation(page);
  }

  async goToSidebar(menu: "Trust root" | "Artifacts" | "Rekor Search" | "Alerts") {
    await this._page.goto("/");
    await this._page.getByRole("link", { name: menu }).click();
    const targets: Record<"Trust root" | "Artifacts" | "Rekor Search" | "Alerts", { path: string; h1: string }> = {
      "Trust root": { path: "/trust-root", h1: "Trust Root" },
      Artifacts: { path: "/artifacts", h1: "Artifacts" },
      "Rekor Search": { path: "/rekor-search", h1: "Rekor Search" },
      Alerts: { path: "/alerts", h1: "Alerts" },
    };

    const target = targets[menu];
    await expect(this._page.getByRole("heading", { level: 1, name: target.h1 })).toBeVisible();
  }
}
