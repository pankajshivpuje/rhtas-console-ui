/* eslint-disable @typescript-eslint/no-explicit-any */

vi.mock("react-router-dom", () => ({
  Link: ({ children, to }: any) => (
    <a href={typeof to === "string" ? to : `${to.pathname}${to.search}`}>{children}</a>
  ),
}));

import atobMock from "../__mocks__/atobMock";
import { render, screen } from "@testing-library/react";
import { ResultsTable } from "./ResultsTable";
import type { RekorEntries } from "../api/rekor-api";

describe("ResultsTable", () => {
  beforeAll(() => {
    atobMock();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  const mockEntries: RekorEntries = {
    totalCount: 2,
    entries: [
      {
        uuid1: {
          body: Buffer.from(
            JSON.stringify({
              kind: "hashedrekord",
              apiVersion: "v1",
              spec: {
                data: { hash: { algorithm: "sha256", value: "abc123" } },
                signature: {
                  content: "sigContent",
                  publicKey: { content: Buffer.from("certContent").toString("base64") },
                },
              },
            }),
          ).toString("base64"),
          logID: "log1",
          logIndex: 100,
          integratedTime: 1722729600,
          verification: {},
        },
      },
      {
        uuid2: {
          body: Buffer.from(
            JSON.stringify({
              kind: "dsse",
              apiVersion: "0.0.1",
              spec: {
                payloadHash: { algorithm: "sha256", value: "def456" },
                signatures: [{ signature: "dsseSig", verifier: "dmVyaWZpZXI=" }],
              },
            }),
          ).toString("base64"),
          logID: "log2",
          logIndex: 101,
          integratedTime: 1722729600,
          verification: {},
        },
      },
    ],
  };

  const onSetPage = vi.fn();

  it("renders the table with correct columns", () => {
    render(<ResultsTable rekorEntries={mockEntries} page={1} onSetPage={onSetPage} />);

    expect(screen.getByText("Search results")).toBeInTheDocument();
    expect(screen.getByText("Commit Hash")).toBeInTheDocument();
    expect(screen.getByText("Log Index")).toBeInTheDocument();
    expect(screen.getByText("Entry UUID")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Signature")).toBeInTheDocument();
    expect(screen.getByText("Public Certificate")).toBeInTheDocument();
    expect(screen.getByText("Integrated time")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
  });

  it("renders row data correctly", () => {
    render(<ResultsTable rekorEntries={mockEntries} page={1} onSetPage={onSetPage} />);

    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("101")).toBeInTheDocument();
    expect(screen.getByText("hashedrekord")).toBeInTheDocument();
    expect(screen.getByText("dsse")).toBeInTheDocument();
  });

  it("renders View details links", () => {
    render(<ResultsTable rekorEntries={mockEntries} page={1} onSetPage={onSetPage} />);

    const viewDetailsLinks = screen.getAllByText("View details");
    expect(viewDetailsLinks).toHaveLength(2);
  });

  it("shows Valid label when certificate is present", () => {
    render(<ResultsTable rekorEntries={mockEntries} page={1} onSetPage={onSetPage} />);

    const validLabels = screen.getAllByText("Valid");
    expect(validLabels.length).toBeGreaterThanOrEqual(1);
  });
});
