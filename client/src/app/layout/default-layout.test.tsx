import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ENV from "@app/env";
import { DefaultLayout } from "./default-layout";

vi.mock("@app/env", () => ({ default: { MOCK: "on" } }));
vi.mock("./header", () => ({ HeaderApp: () => <header>Masthead</header> }));
vi.mock("./sidebar", () => ({ SidebarApp: () => null }));
vi.mock("@app/components/PageDrawerContext", () => ({
  PageContentWithDrawerProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("mockup controls", () => {
  it("places the compact health selector before the masthead", () => {
    ENV.MOCK = "on";
    render(<DefaultLayout>Page content</DefaultLayout>);
    const control = screen.getByRole("combobox", { name: "System health" });
    const masthead = screen.getByRole("banner");
    expect(control.compareDocumentPosition(masthead) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const row = screen.getByRole("group", { name: "Mockup controls" });
    expect(row).toHaveStyle({ display: "flex", alignItems: "center", justifyContent: "flex-end" });
    expect(screen.getByText("System health").parentElement).toBe(row);
    expect(row).toContainElement(control);
  });

  it("does not display the controls in live mode", () => {
    ENV.MOCK = "off";
    render(<DefaultLayout>Page content</DefaultLayout>);
    expect(screen.queryByRole("combobox", { name: "System health" })).not.toBeInTheDocument();
  });
});
