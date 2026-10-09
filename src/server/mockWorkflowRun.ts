import type { StreamEvent } from "@/types/log.types";

// Stand-in for a real workflow executor: walks the given nodes in order and
// emits the same event stream a backend would. Used by the mock SSE route.

export interface MockRunOptions {
  runId: string;
  nodeIds: string[];
  /** Log lines per node. */
  linesPerNode?: number;
  /** Approximate log lines per second (DoD stress target: 200+). */
  linesPerSecond?: number;
  /** Emit a HIL request after this node finishes. */
  hilAfterNodeId?: string;
  signal?: AbortSignal;
}

const MESSAGES = [
  "Resolving input bindings",
  "Dispatching request",
  "Received partial response chunk",
  "Validating output against schema",
  "Cache miss, fetching fresh context",
  "Retrying transient failure",
  "Token usage within budget",
  "Writing intermediate result",
];

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      resolve();
    });
  });

export async function* mockWorkflowRun({
  runId,
  nodeIds,
  linesPerNode = 40,
  linesPerSecond = 40,
  hilAfterNodeId,
  signal,
}: MockRunOptions): AsyncGenerator<StreamEvent> {
  let seq = 0;
  const nextId = () => `${runId}-${++seq}`;
  const interval = 1000 / linesPerSecond;

  for (const nodeId of nodeIds) {
    yield { type: "node_status", nodeId, status: "running", progress: 0 };

    for (let line = 0; line < linesPerNode; line++) {
      if (signal?.aborted) return;
      const isWarning = line % 17 === 16;
      yield {
        type: "log",
        id: nextId(),
        timestamp: Date.now(),
        level: isWarning ? "warn" : line % 5 === 0 ? "debug" : "info",
        nodeId,
        message: `${MESSAGES[line % MESSAGES.length]} (${line + 1}/${linesPerNode})`,
      };
      if (line % 8 === 7) {
        const progress = Math.round(((line + 1) / linesPerNode) * 100);
        yield { type: "node_status", nodeId, status: "running", progress };
      }
      await sleep(interval, signal);
    }

    yield { type: "node_status", nodeId, status: "success", progress: 100 };

    if (nodeId === hilAfterNodeId) {
      yield {
        type: "hil_request",
        id: nextId(),
        timestamp: Date.now(),
        requestId: `${runId}-hil-${nodeId}`,
        nodeId,
        message: "Approve sending the generated response to the customer?",
      };
    }
  }
}
