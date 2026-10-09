"use client";

import { Button } from "@/components/ui/button/Button";
import { useWorkflowRun } from "@/hooks/useWorkflowRun";
import type { SSEStatus } from "@/hooks/useSSE";

const STATUS_TEXT: Record<SSEStatus, string> = {
  idle: "Idle",
  connecting: "Connecting…",
  open: "Streaming",
  reconnecting: "Reconnecting…",
  closed: "Run finished",
  failed: "Connection failed",
};

export function RunControls({ workflowId }: { workflowId: string }) {
  const { start, stop, isRunning, status, retry } = useWorkflowRun(workflowId);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500" aria-live="polite">
        {STATUS_TEXT[status]}
      </span>
      {status === "failed" ? (
        <Button size="sm" variant="secondary" onClick={retry}>
          Retry
        </Button>
      ) : null}
      {isRunning ? (
        <Button size="sm" variant="secondary" onClick={stop}>
          Stop
        </Button>
      ) : (
        <>
          <Button size="sm" variant="ghost" onClick={() => start({ stress: true })}>
            Stress run
          </Button>
          <Button size="sm" onClick={() => start()}>
            Run
          </Button>
        </>
      )}
    </div>
  );
}
