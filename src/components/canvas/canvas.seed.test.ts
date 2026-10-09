import { describe, expect, it } from "vitest";

import { generateLargeWorkflow, seedFromSearch } from "./canvas.seed";
import { wouldCreateCycle } from "./canvas.utils";

describe("generateLargeWorkflow", () => {
  const { nodes, edges } = generateLargeWorkflow(300);

  it("creates the requested number of nodes with unique ids", () => {
    expect(nodes).toHaveLength(300);
    expect(new Set(nodes.map((node) => node.id)).size).toBe(300);
  });

  it("only connects existing nodes, forward, so the graph is acyclic", () => {
    const ids = new Set(nodes.map((node) => node.id));
    for (const edge of edges) {
      expect(ids.has(edge.source) && ids.has(edge.target)).toBe(true);
      const others = edges.filter((other) => other !== edge);
      expect(wouldCreateCycle(nodes, others, edge)).toBe(false);
    }
  });

  it("routes condition edges through the true/false handles", () => {
    const fromConditions = edges.filter((edge) => edge.sourceHandle);
    expect(fromConditions.length).toBeGreaterThan(0);
    expect(new Set(fromConditions.map((edge) => edge.sourceHandle))).toEqual(
      new Set(["true", "false"]),
    );
  });
});

describe("seedFromSearch", () => {
  it("falls back to the demo workflow", () => {
    expect(seedFromSearch("").nodes).toHaveLength(3);
    expect(seedFromSearch("?nodes=abc").nodes).toHaveLength(3);
  });

  it("generates a large workflow when ?nodes is set", () => {
    expect(seedFromSearch("?nodes=320").nodes).toHaveLength(320);
  });
});
