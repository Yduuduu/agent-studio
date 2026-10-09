import type { NodeProps } from "@xyflow/react";
import { memo } from "react";

import type { WorkflowNode } from "@/store/useCanvasStore";

import { BaseNode } from "./BaseNode";

function LLMNodeComponent({ data, selected }: NodeProps<WorkflowNode>) {
  return (
    <BaseNode data={data} selected={selected} icon={<span aria-hidden="true">🧠</span>}>
      {(data.config?.model as string | undefined) || "LLM inference step"}
    </BaseNode>
  );
}

export const LLMNode = memo(
  LLMNodeComponent,
  (prev, next) =>
    prev.selected === next.selected &&
    prev.data.label === next.data.label &&
    prev.data.status === next.data.status &&
    prev.data.progress === next.data.progress &&
    prev.data.config === next.data.config,
);
