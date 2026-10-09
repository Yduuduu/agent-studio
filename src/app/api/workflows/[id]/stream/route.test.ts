// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { streamEventSchema, type HILDecision, type StreamEvent } from "@/types/log.types";

import { POST } from "../hil/[requestId]/route";
import { GET } from "./route";

function decide(requestId: string, decision: HILDecision) {
  const request = new NextRequest(`http://localhost/api/workflows/wf/hil/${requestId}`, {
    method: "POST",
    body: JSON.stringify({ decision }),
  });
  return POST(request, { params: Promise.resolve({ id: "wf", requestId }) });
}

/** Reads the SSE stream to completion, answering HIL requests as they arrive. */
async function runToEnd(query: string, decision: HILDecision) {
  const request = new NextRequest(`http://localhost/api/workflows/wf/stream?${query}`);
  const response = await GET(request, { params: Promise.resolve({ id: "wf" }) });
  expect(response.headers.get("content-type")).toBe("text/event-stream");

  const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
  const events: StreamEvent[] = [];
  let buffer = "";
  let ended = false;

  while (!ended) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      if (chunk.startsWith("event: end")) {
        ended = true;
        continue;
      }
      const event = streamEventSchema.parse(JSON.parse(chunk.replace(/^data: /, "")));
      events.push(event);
      if (event.type === "hil_request") {
        expect((await decide(event.requestId, decision)).status).toBe(200);
      }
    }
  }
  return { events, ended };
}

const statusesOf = (events: StreamEvent[]) =>
  events.flatMap((e) => (e.type === "node_status" ? [`${e.nodeId}:${e.status}`] : []));

describe("GET /api/workflows/:id/stream", () => {
  it("pauses at the HIL gate and continues once approved", async () => {
    const { events, ended } = await runToEnd("nodes=a,b&lines=3&rate=1000&hil=a", "approved");

    expect(ended).toBe(true);
    expect(events.filter((e) => e.type === "hil_request")).toEqual([
      expect.objectContaining({ workflowId: "wf", nodeId: "a" }),
    ]);
    expect(statusesOf(events)).toEqual([
      "a:running",
      "a:pending",
      "a:success",
      "b:running",
      "b:success",
    ]);
    expect(events).toContainEqual(
      expect.objectContaining({ message: "Operator approved; continuing run" }),
    );
  });

  it("halts the run when rejected", async () => {
    const { events } = await runToEnd("nodes=a,b&lines=2&rate=1000&hil=a", "rejected");
    expect(statusesOf(events)).toEqual(["a:running", "a:pending", "a:error"]);
  });
});

describe("POST /api/workflows/:id/hil/:requestId", () => {
  it("rejects an invalid body with 400", async () => {
    const request = new NextRequest("http://localhost/api/workflows/wf/hil/x", {
      method: "POST",
      body: JSON.stringify({ decision: "maybe" }),
    });
    const response = await POST(request, { params: Promise.resolve({ id: "wf", requestId: "x" }) });
    expect(response.status).toBe(400);
  });

  it("returns 404 for a request nobody is waiting on", async () => {
    expect((await decide("unknown", "approved")).status).toBe(404);
  });
});
