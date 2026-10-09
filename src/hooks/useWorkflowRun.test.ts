import { describe, expect, it } from "vitest";

import { buildRunUrl } from "./useWorkflowRun";

describe("buildRunUrl", () => {
  it("encodes nodes, HIL node and run id", () => {
    const url = new URL(buildRunUrl("demo", ["a", "b"], "b", "r1"), "http://x");
    expect(url.pathname).toBe("/api/workflows/demo/stream");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      nodes: "a,b",
      rate: "40",
      lines: "30",
      run: "r1",
      hil: "b",
    });
  });

  it("uses the 200+ lines/s rate in stress mode", () => {
    const url = new URL(buildRunUrl("demo", ["a"], undefined, "r", { stress: true }), "http://x");
    expect(Number(url.searchParams.get("rate"))).toBeGreaterThanOrEqual(200);
    expect(url.searchParams.has("hil")).toBe(false);
  });
});
