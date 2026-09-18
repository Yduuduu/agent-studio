import type { Connection, Edge, Node } from "@xyflow/react";

/**
 * Returns true if adding `candidate` to the graph (nodes, edges) would
 * introduce a cycle, i.e. a path already exists from candidate.target
 * back to candidate.source.
 */
export function wouldCreateCycle(
  nodes: Node[],
  edges: Edge[],
  candidate: Connection | Edge,
): boolean {
  const { source, target } = candidate;
  if (!source || !target) return false;
  if (source === target) return true;

  const adjacency = new Map<string, string[]>();
  for (const node of nodes) adjacency.set(node.id, []);
  for (const edge of edges) {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    adjacency.get(edge.source)!.push(edge.target);
  }
  if (!adjacency.has(source)) adjacency.set(source, []);
  adjacency.get(source)!.push(target);

  const visited = new Set<string>();
  const stack = [target];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === source) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const next of adjacency.get(current) ?? []) {
      stack.push(next);
    }
  }

  return false;
}
