import type { EdgeTypes, NodeTypes } from "@xyflow/react";

import { ConditionNode } from "./nodes/ConditionNode";
import { DBQueryNode } from "./nodes/DBQueryNode";
import { LLMNode } from "./nodes/LLMNode";

export const NODE_TYPES: NodeTypes = {
  llm: LLMNode,
  "db-query": DBQueryNode,
  condition: ConditionNode,
};

export const EDGE_TYPES: EdgeTypes = {};
