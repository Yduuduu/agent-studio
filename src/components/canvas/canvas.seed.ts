import type { Edge } from "@xyflow/react";

import type { WorkflowNode } from "@/store/useCanvasStore";
import type { WorkflowNodeKind } from "@/types/node.schema";

export const DEMO_NODES: WorkflowNode[] = [
  {
    id: "start-llm",
    type: "llm",
    position: { x: 80, y: 80 },
    data: { label: "Generate Response", kind: "llm", status: "success" },
  },
  {
    id: "fetch-db",
    type: "db-query",
    position: { x: 400, y: 80 },
    data: { label: "Fetch User Context", kind: "db-query", status: "running", progress: 62 },
  },
  {
    id: "branch",
    type: "condition",
    position: { x: 720, y: 80 },
    data: { label: "Needs Approval?", kind: "condition", status: "idle" },
  },
];

export const DEMO_EDGES: Edge[] = [
  { id: "start-llm->fetch-db", source: "start-llm", target: "fetch-db" },
  { id: "fetch-db->branch", source: "fetch-db", target: "branch" },
];

const KINDS: WorkflowNodeKind[] = ["llm", "db-query", "condition"];
const ROWS_PER_COLUMN = 15;
const COLUMN_GAP = 320;
const ROW_GAP = 120;

/**
 * Layered DAG for load testing (DoD: 300+ nodes). Each node feeds one or two
 * nodes in the next column, so edges never point backwards and no cycle exists.
 */
export function generateLargeWorkflow(count: number): { nodes: WorkflowNode[]; edges: Edge[] } {
  const nodes: WorkflowNode[] = Array.from({ length: count }, (_, index) => {
    const column = Math.floor(index / ROWS_PER_COLUMN);
    const row = index % ROWS_PER_COLUMN;
    const kind = KINDS[index % KINDS.length]!;
    return {
      id: `n${index}`,
      type: kind,
      position: { x: column * COLUMN_GAP, y: row * ROW_GAP },
      data: { label: `Step ${index + 1}`, kind, status: "idle" },
    };
  });

  const edges: Edge[] = [];
  for (let index = 0; index + ROWS_PER_COLUMN < count; index++) {
    const targets = [index + ROWS_PER_COLUMN, index + ROWS_PER_COLUMN + 1].filter(
      (target, i) => target < count && (i === 0 || index % 2 === 0),
    );
    const source = nodes[index]!;
    targets.forEach((target, i) => {
      edges.push({
        id: `n${index}->n${target}`,
        source: source.id,
        // Condition nodes branch through their "true" / "false" handles.
        sourceHandle: source.data.kind === "condition" ? (i === 0 ? "true" : "false") : undefined,
        target: `n${target}`,
      });
    });
  }

  return { nodes, edges };
}

/** `?nodes=300` seeds a generated workflow; anything else seeds the demo. */
export function seedFromSearch(search: string) {
  const requested = Number.parseInt(new URLSearchParams(search).get("nodes") ?? "", 10);
  if (Number.isNaN(requested) || requested <= 0) return { nodes: DEMO_NODES, edges: DEMO_EDGES };
  return generateLargeWorkflow(Math.min(requested, 2000));
}
