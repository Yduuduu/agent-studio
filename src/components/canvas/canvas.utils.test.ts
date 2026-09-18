import type { Edge, Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";

import { wouldCreateCycle } from "./canvas.utils";

function node(id: string): Node {
  return { id, position: { x: 0, y: 0 }, data: {} };
}

function edge(source: string, target: string): Edge {
  return { id: `${source}-${target}`, source, target };
}

function connection(source: string, target: string) {
  return { source, target, sourceHandle: null, targetHandle: null };
}

describe("wouldCreateCycle", () => {
  const nodes = [node("a"), node("b"), node("c")];

  it("allows connecting two disconnected nodes", () => {
    expect(wouldCreateCycle(nodes, [], connection("a", "b"))).toBe(false);
  });

  it("allows extending a linear chain", () => {
    const edges = [edge("a", "b")];
    expect(wouldCreateCycle(nodes, edges, connection("b", "c"))).toBe(false);
  });

  it("rejects a direct self loop", () => {
    expect(wouldCreateCycle(nodes, [], connection("a", "a"))).toBe(true);
  });

  it("rejects closing a cycle across a chain (a->b->c, then c->a)", () => {
    const edges = [edge("a", "b"), edge("b", "c")];
    expect(wouldCreateCycle(nodes, edges, connection("c", "a"))).toBe(true);
  });

  it("rejects a direct back-edge (a->b, then b->a)", () => {
    const edges = [edge("a", "b")];
    expect(wouldCreateCycle(nodes, edges, connection("b", "a"))).toBe(true);
  });
});
