import type { NextRequest } from "next/server";

import { mockWorkflowRun } from "@/server/mockWorkflowRun";

const encoder = new TextEncoder();
const sse = (data: unknown, event?: string) =>
  encoder.encode(`${event ? `event: ${event}\n` : ""}data: ${JSON.stringify(data)}\n\n`);

const clampInt = (raw: string | null, fallback: number, min: number, max: number) => {
  const value = Number.parseInt(raw ?? "", 10);
  return Number.isNaN(value) ? fallback : Math.min(Math.max(value, min), max);
};

/**
 * Mock run stream. GET /api/workflows/:id/stream?nodes=a,b,c&rate=40&lines=40&hil=b
 * Emits node_status / log / hil_request events, then a named `end` event.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const query = request.nextUrl.searchParams;
  const nodeIds = (query.get("nodes") ?? "").split(",").filter(Boolean);

  const run = mockWorkflowRun({
    workflowId: id,
    runId: `${id}-${Date.now().toString(36)}`,
    nodeIds,
    linesPerSecond: clampInt(query.get("rate"), 40, 1, 1000),
    linesPerNode: clampInt(query.get("lines"), 40, 1, 10_000),
    hilAfterNodeId: query.get("hil") ?? undefined,
    signal: request.signal,
  });

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await run.next();
      if (done) {
        controller.enqueue(sse({}, "end"));
        controller.close();
        return;
      }
      controller.enqueue(sse(value));
    },
    async cancel() {
      await run.return(undefined);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
