import { beforeEach, describe, expect, it } from "vitest";

import { useCanvasStore } from "@/store/useCanvasStore";
import { useLogStore } from "@/store/useLogStore";

import { routeStreamEvent } from "./useWorkflowStream";

beforeEach(() => {
  useLogStore.getState().clear();
  useCanvasStore.setState({
    edges: [],
    nodes: [
      {
        id: "n1",
        type: "llm",
        position: { x: 0, y: 0 },
        data: { label: "n1", kind: "llm", status: "idle" },
      },
    ],
  });
});

describe("routeStreamEvent", () => {
  it("sends node_status events to the canvas", () => {
    routeStreamEvent({ type: "node_status", nodeId: "n1", status: "running", progress: 40 });
    expect(useCanvasStore.getState().nodes[0]?.data).toMatchObject({
      status: "running",
      progress: 40,
    });
  });

  it("sends logs and HIL requests (as pending) to the log store", () => {
    routeStreamEvent({ type: "log", id: "1", timestamp: 1, level: "info", message: "hi" });
    routeStreamEvent({
      type: "hil_request",
      id: "2",
      timestamp: 2,
      workflowId: "wf",
      requestId: "r",
      message: "ok?",
    });
    useLogStore.getState().flush();

    expect(useLogStore.getState().logs.map((entry) => entry.type)).toEqual(["log", "hil_request"]);
    expect(useLogStore.getState().logs[1]).toMatchObject({ resolution: "pending" });
  });
});
