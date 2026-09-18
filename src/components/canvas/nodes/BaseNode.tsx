import { Handle, Position } from "@xyflow/react";
import { memo, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge/Badge";
import { ProgressBar } from "@/components/ui/progress-bar/ProgressBar";
import { cn } from "@/utils/cn";
import type { BaseNodeData } from "@/types/node.schema";

interface BaseNodeProps {
  data: BaseNodeData;
  selected?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
  hasSourceHandle?: boolean;
  hasTargetHandle?: boolean;
}

function BaseNodeComponent({
  data,
  selected,
  icon,
  children,
  hasSourceHandle = true,
  hasTargetHandle = true,
}: BaseNodeProps) {
  return (
    <div
      className={cn(
        "min-w-[220px] rounded-lg border bg-white shadow-sm",
        selected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200",
      )}
    >
      {hasTargetHandle ? (
        <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !bg-gray-400" />
      ) : null}

      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-gray-900">{data.label}</span>
        </div>
        <Badge status={data.status} />
      </div>

      {children ? <div className="px-3 py-2 text-xs text-gray-600">{children}</div> : null}

      {data.status === "running" ? (
        <div className="px-3 pb-2">
          <ProgressBar value={data.progress ?? 0} />
        </div>
      ) : null}

      {hasSourceHandle ? (
        <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !bg-gray-400" />
      ) : null}
    </div>
  );
}

export const BaseNode = memo(BaseNodeComponent);
