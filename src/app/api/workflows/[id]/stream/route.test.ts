// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { streamEventSchema } from "@/types/log.types";

import { GET } from "./route";

async function readEvents(response: Response) {
  const text = await response.text();
  return text
    .split("\n\n")
    .filter(Boolean)
    .map((chunk) => {
      const event = /^event: (.+)$/m.exec(chunk)?.[1] ?? "message";
      const data = JSON.parse(/^data: (.+)$/m.exec(chunk)![1]!) as unknown;
      return { event, data };
    });
}

describe("GET /api/workflows/:id/stream", () => {
  it("streams schema-valid events for each node, a HIL request, then end", async () => {
    const request = new NextRequest(
      "http://localhost/api/workflows/wf/stream?nodes=a,b&lines=3&rate=1000&hil=a",
    );
    const response = await GET(request, { params: Promise.resolve({ id: "wf" }) });
    expect(response.headers.get("content-type")).toBe("text/event-stream");

    const events = await readEvents(response);
    expect(events.at(-1)?.event).toBe("end");

    const messages = events.filter((e) => e.event === "message").map((e) => e.data);
    const parsed = messages.map((data) => streamEventSchema.parse(data));

    expect(parsed.filter((e) => e.type === "log")).toHaveLength(6);
    expect(parsed.filter((e) => e.type === "hil_request")).toEqual([
      expect.objectContaining({ nodeId: "a", requestId: expect.stringContaining("hil-a") }),
    ]);
    const statuses = parsed.flatMap((e) =>
      e.type === "node_status" ? [`${e.nodeId}:${e.status}`] : [],
    );
    expect(statuses).toEqual(["a:running", "a:success", "b:running", "b:success"]);
  });
});
