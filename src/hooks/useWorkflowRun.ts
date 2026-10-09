import { useCallback, useState } from "react";

import { useCanvasStore } from "@/store/useCanvasStore";
import { useLogStore } from "@/store/useLogStore";

import { useWorkflowStream } from "./useWorkflowStream";

export interface RunOptions {
  /** Stress mode targets the DoD load: 200+ log lines per second. */
  stress?: boolean;
}

export function buildRunUrl(
  workflowId: string,
  nodeIds: string[],
  hilNodeId: string | undefined,
  runId: string,
  { stress = false }: RunOptions = {},
) {
  const params = new URLSearchParams({
    nodes: nodeIds.join(","),
    rate: stress ? "250" : "40",
    lines: stress ? "400" : "30",
    run: runId,
  });
  if (hilNodeId) params.set("hil", hilNodeId);
  return `/api/workflows/${encodeURIComponent(workflowId)}/stream?${params.toString()}`;
}

/** Starts / stops a (mock) run of the current canvas and streams its events. */
export function useWorkflowRun(workflowId: string) {
  const [url, setUrl] = useState<string | null>(null);
  const stream = useWorkflowStream(url);

  const start = useCallback(
    (options?: RunOptions) => {
      const { nodes, updateNodeData } = useCanvasStore.getState();
      useLogStore.getState().clear();
      for (const node of nodes) updateNodeData(node.id, { status: "pending", progress: undefined });

      const hilNode = nodes.find((node) => node.data.kind === "condition");
      const runId = Date.now().toString(36);
      setUrl(
        buildRunUrl(
          workflowId,
          nodes.map((node) => node.id),
          hilNode?.id,
          runId,
          options,
        ),
      );
    },
    [workflowId],
  );

  const stop = useCallback(() => setUrl(null), []);

  const isRunning =
    stream.status === "connecting" || stream.status === "open" || stream.status === "reconnecting";

  return { start, stop, isRunning, status: stream.status, retry: stream.retry };
}
