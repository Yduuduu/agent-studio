import type { NodeChange } from "@xyflow/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useUndoRedoStore } from "@/hooks/useUndoRedo";

import { useCanvasStore, type WorkflowNode } from "./useCanvasStore";

function node(id: string, x = 0): WorkflowNode {
  return {
    id,
    type: "llm",
    position: { x, y: 0 },
    data: { label: id, kind: "llm", status: "idle" },
  };
}

function drag(id: string, x: number, dragging: boolean): NodeChange<WorkflowNode> {
  return { type: "position", id, position: { x, y: 0 }, dragging };
}

const canvas = () => useCanvasStore.getState();
const history = () => useUndoRedoStore.getState();

beforeEach(() => {
  useCanvasStore.setState({ nodes: [], edges: [] });
  history().clear();
});

describe("useCanvasStore", () => {
  it("addNode appends the node and is undoable", () => {
    canvas().addNode(node("a"));
    expect(canvas().nodes.map((n) => n.id)).toEqual(["a"]);

    history().undo();
    expect(canvas().nodes).toEqual([]);

    history().redo();
    expect(canvas().nodes.map((n) => n.id)).toEqual(["a"]);
  });

  it("removeNode drops connected edges and undo restores both", () => {
    canvas().setNodes([node("a"), node("b")]);
    canvas().setEdges([{ id: "a-b", source: "a", target: "b" }]);

    canvas().removeNode("a");
    expect(canvas().nodes.map((n) => n.id)).toEqual(["b"]);
    expect(canvas().edges).toEqual([]);

    history().undo();
    expect(canvas().nodes.map((n) => n.id)).toEqual(["a", "b"]);
    expect(canvas().edges).toHaveLength(1);
  });

  it("onConnect adds an edge and records history", () => {
    canvas().setNodes([node("a"), node("b")]);
    canvas().onConnect({ source: "a", target: "b", sourceHandle: null, targetHandle: null });

    expect(canvas().edges).toHaveLength(1);
    expect(history().past).toHaveLength(1);

    history().undo();
    expect(canvas().edges).toEqual([]);
  });

  it("commits a single history entry per drag gesture, undoing to the pre-drag position", () => {
    canvas().setNodes([node("a", 0)]);

    canvas().onNodesChange([drag("a", 10, true)]);
    canvas().onNodesChange([drag("a", 20, true)]);
    canvas().onNodesChange([drag("a", 30, false)]);

    expect(canvas().nodes[0]?.position.x).toBe(30);
    expect(history().past).toHaveLength(1);

    history().undo();
    expect(canvas().nodes[0]?.position.x).toBe(0);

    history().redo();
    expect(canvas().nodes[0]?.position.x).toBe(30);
  });

  it("removing a node via onNodesChange also removes its edges", () => {
    canvas().setNodes([node("a"), node("b")]);
    canvas().setEdges([{ id: "a-b", source: "a", target: "b" }]);

    canvas().onNodesChange([{ type: "remove", id: "b" }]);
    expect(canvas().edges).toEqual([]);

    history().undo();
    expect(canvas().nodes).toHaveLength(2);
    expect(canvas().edges).toHaveLength(1);
  });

  it("onEdgesChange records history only for removals", () => {
    canvas().setEdges([{ id: "a-b", source: "a", target: "b" }]);

    canvas().onEdgesChange([{ type: "select", id: "a-b", selected: true }]);
    expect(history().past).toHaveLength(0);

    canvas().onEdgesChange([{ type: "remove", id: "a-b" }]);
    expect(canvas().edges).toEqual([]);
    expect(history().past).toHaveLength(1);
  });

  it("updateNodeData merges data without touching history", () => {
    canvas().setNodes([node("a")]);
    canvas().updateNodeData("a", { status: "running", progress: 40 });

    expect(canvas().nodes[0]?.data).toMatchObject({ label: "a", status: "running", progress: 40 });
    expect(history().past).toHaveLength(0);
  });
});

describe("useCanvasStore.updateNodeSettings", () => {
  it("replaces label and config and is undoable", () => {
    canvas().setNodes([node("a")]);
    canvas().updateNodeSettings("a", { label: "Renamed", config: { model: "m" } });

    expect(canvas().nodes[0]?.data).toMatchObject({ label: "Renamed", config: { model: "m" } });

    history().undo();
    expect(canvas().nodes[0]?.data.label).toBe("a");
    expect(canvas().nodes[0]?.data.config).toBeUndefined();
  });
});
