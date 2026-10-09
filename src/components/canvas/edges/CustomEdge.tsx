import { BaseEdge, EdgeToolbar, getBezierPath, type EdgeProps } from "@xyflow/react";
import { memo, useCallback } from "react";

import { useCanvasStore } from "@/store/useCanvasStore";
import { cn } from "@/utils/cn";

const BRANCH_LABEL_CLASSES: Record<string, string> = {
  true: "bg-green-50 text-green-700 ring-green-200",
  false: "bg-red-50 text-red-700 ring-red-200",
};

function CustomEdgeComponent({
  id,
  source,
  sourceHandleId,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  markerEnd,
}: EdgeProps) {
  const [path, centerX, centerY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Boolean selector: the edge re-renders only when its source starts/stops running.
  const isFlowing = useCanvasStore(
    (state) => state.nodes.find((node) => node.id === source)?.data.status === "running",
  );

  const remove = useCallback(() => {
    useCanvasStore.getState().onEdgesChange([{ type: "remove", id }]);
  }, [id]);

  // Condition nodes expose "true" / "false" source handles; label those branches.
  const branch = sourceHandleId && sourceHandleId in BRANCH_LABEL_CLASSES ? sourceHandleId : null;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        className={cn(
          "stroke-gray-400 transition-colors",
          isFlowing &&
            "animate-[dashdraw_0.5s_linear_infinite] stroke-blue-500 [stroke-dasharray:5]",
          selected && "stroke-blue-600 stroke-2",
        )}
      />
      <EdgeToolbar edgeId={id} x={centerX} y={centerY} isVisible={Boolean(branch) || selected}>
        <div className="flex items-center gap-1">
          {branch ? (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1",
                BRANCH_LABEL_CLASSES[branch],
              )}
            >
              {branch}
            </span>
          ) : null}
          {selected ? (
            <button
              type="button"
              onClick={remove}
              className="nodrag nopan flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs text-gray-500 shadow ring-1 ring-gray-300 hover:bg-red-50 hover:text-red-600"
              aria-label="Delete connection"
            >
              ✕
            </button>
          ) : null}
        </div>
      </EdgeToolbar>
    </>
  );
}

export const CustomEdge = memo(CustomEdgeComponent);
