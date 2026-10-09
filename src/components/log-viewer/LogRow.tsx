import { memo } from "react";

import { useCanvasStore } from "@/store/useCanvasStore";
import type { LogEntry, LogLevel } from "@/types/log.types";
import { cn } from "@/utils/cn";

import { formatLogTime } from "./log-viewer.utils";

const LEVEL_CLASSES: Record<LogLevel, string> = {
  debug: "text-gray-400",
  info: "text-blue-600",
  warn: "text-amber-600",
  error: "text-red-600",
};

interface LogRowProps {
  entry: LogEntry;
}

function LogRowComponent({ entry }: LogRowProps) {
  // Subscribes to a single string, so unrelated canvas updates don't re-render the row.
  const nodeLabel = useCanvasStore((state) =>
    entry.nodeId ? state.nodes.find((node) => node.id === entry.nodeId)?.data.label : undefined,
  );
  const isHIL = entry.type === "hil_request";

  return (
    <div
      className={cn(
        "flex gap-3 border-b border-gray-100 px-3 py-1 font-mono text-xs",
        isHIL && "border-l-2 border-l-amber-400 bg-amber-50 py-2",
      )}
    >
      <time className="shrink-0 text-gray-400 tabular-nums">{formatLogTime(entry.timestamp)}</time>
      <span
        className={cn(
          "w-12 shrink-0 font-semibold uppercase",
          isHIL ? "text-amber-700" : LEVEL_CLASSES[entry.level],
        )}
      >
        {isHIL ? "hil" : entry.level}
      </span>
      {nodeLabel ? (
        <span className="max-w-40 shrink-0 truncate text-gray-500">{nodeLabel}</span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="break-words whitespace-pre-wrap text-gray-800">{entry.message}</p>
        {isHIL ? (
          <p className="mt-1 text-gray-500">
            {entry.resolution === "pending" ? "Awaiting approval" : entry.resolution}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export const LogRow = memo(LogRowComponent);
