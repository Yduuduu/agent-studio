import { useCanvasStore } from "@/store/useCanvasStore";
import { useLogStore } from "@/store/useLogStore";
import { streamEventSchema, type StreamEvent } from "@/types/log.types";

import { useSSE } from "./useSSE";

const parseStreamEvent = (raw: string): StreamEvent =>
  streamEventSchema.parse(JSON.parse(raw) as unknown);

export function routeStreamEvent(event: StreamEvent) {
  switch (event.type) {
    case "log":
      useLogStore.getState().enqueue(event);
      break;
    case "hil_request":
      useLogStore.getState().enqueue({ ...event, resolution: "pending" });
      break;
    case "node_status":
      useCanvasStore
        .getState()
        .updateNodeData(event.nodeId, { status: event.status, progress: event.progress });
      break;
  }
}

/**
 * Streams a workflow run: log lines and HIL requests go to the batched log
 * store, node status updates go straight to the canvas.
 */
export function useWorkflowStream(url: string | null) {
  return useSSE<StreamEvent>({
    url: url ?? "",
    enabled: url !== null,
    onMessage: routeStreamEvent,
    parse: parseStreamEvent,
  });
}
