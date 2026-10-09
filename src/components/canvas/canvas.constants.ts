import type { DefaultEdgeOptions, EdgeTypes, NodeTypes } from "@xyflow/react";

import { CustomEdge } from "./edges/CustomEdge";
import { ConditionNode } from "./nodes/ConditionNode";
import { DBQueryNode } from "./nodes/DBQueryNode";
import { LLMNode } from "./nodes/LLMNode";

export const NODE_TYPES: NodeTypes = {
  llm: LLMNode,
  "db-query": DBQueryNode,
  condition: ConditionNode,
};

export const EDGE_TYPES: EdgeTypes = {
  workflow: CustomEdge,
};

// Applied to every edge at render and to new connections, so seeded and
// user-drawn edges all use the custom edge without setting `type` each time.
export const DEFAULT_EDGE_OPTIONS: DefaultEdgeOptions = { type: "workflow" };
