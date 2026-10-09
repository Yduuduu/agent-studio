import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { memo } from "react";

import { Badge } from "@/components/ui/badge/Badge";
import { cn } from "@/utils/cn";
import type { WorkflowNode } from "@/store/useCanvasStore";

function ConditionNodeComponent({ data, selected }: NodeProps<WorkflowNode>) {
  const rules = data.config?.rules;
  const ruleCount = Array.isArray(rules) ? rules.length : 0;

  return (
    <div
      className={cn(
        "min-w-[220px] rounded-lg border bg-white shadow-sm",
        selected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200",
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !bg-gray-400" />

      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2">
        <div className="flex items-center gap-2">
          <span aria-hidden="true">🔀</span>
          <span className="text-sm font-medium text-gray-900">{data.label}</span>
        </div>
        <Badge status={data.status} />
      </div>

      <div className="px-3 py-2 text-xs text-gray-600">
        {ruleCount ? `${ruleCount} rule${ruleCount > 1 ? "s" : ""}` : "Conditional branch"}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="!top-1/3 !h-2.5 !w-2.5 !bg-green-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        className="!top-2/3 !h-2.5 !w-2.5 !bg-red-500"
      />
    </div>
  );
}

export const ConditionNode = memo(
  ConditionNodeComponent,
  (prev, next) =>
    prev.selected === next.selected &&
    prev.data.label === next.data.label &&
    prev.data.status === next.data.status &&
    prev.data.config === next.data.config,
);
