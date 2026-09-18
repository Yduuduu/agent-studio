import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import { create } from "zustand";

import { useUndoRedoStore } from "@/hooks/useUndoRedo";
import type { BaseNodeData } from "@/types/node.schema";

export type WorkflowNode = Node<BaseNodeData>;

interface CanvasState {
  nodes: WorkflowNode[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: WorkflowNode) => void;
  removeNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<BaseNodeData>) => void;
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: Edge[]) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],

  onNodesChange: (changes) => {
    const before = get().nodes;
    const after = applyNodeChanges(changes, before);
    set({ nodes: after });

    // Only commit history once a drag gesture settles, or on removal —
    // recording every intermediate drag frame would flood the stack.
    const dragSettled = changes.some(
      (change) => change.type === "position" && change.dragging === false,
    );
    const removed = changes.filter((change) => change.type === "remove");

    if (dragSettled) {
      useUndoRedoStore.getState().push({
        undo: () => set({ nodes: before }),
        redo: () => set({ nodes: after }),
      });
    } else if (removed.length > 0) {
      const removedIds = new Set(removed.map((change) => change.id));
      const beforeEdges = get().edges;
      const afterEdges = beforeEdges.filter(
        (edge) => !removedIds.has(edge.source) && !removedIds.has(edge.target),
      );
      set({ edges: afterEdges });
      useUndoRedoStore.getState().push({
        undo: () => set({ nodes: before, edges: beforeEdges }),
        redo: () => set({ nodes: after, edges: afterEdges }),
      });
    }
  },

  onEdgesChange: (changes) => {
    const before = get().edges;
    const after = applyEdgeChanges(changes, before);
    set({ edges: after });

    const removed = changes.some((change) => change.type === "remove");
    if (removed) {
      useUndoRedoStore.getState().push({
        undo: () => set({ edges: before }),
        redo: () => set({ edges: after }),
      });
    }
  },

  onConnect: (connection) => {
    const before = get().edges;
    const after = addEdge(connection, before);
    set({ edges: after });
    useUndoRedoStore.getState().push({
      undo: () => set({ edges: before }),
      redo: () => set({ edges: after }),
    });
  },

  addNode: (node) => {
    const before = get().nodes;
    const after = [...before, node];
    set({ nodes: after });
    useUndoRedoStore.getState().push({
      undo: () => set({ nodes: before }),
      redo: () => set({ nodes: after }),
    });
  },

  removeNode: (nodeId) => {
    const beforeNodes = get().nodes;
    const beforeEdges = get().edges;
    const afterNodes = beforeNodes.filter((node) => node.id !== nodeId);
    const afterEdges = beforeEdges.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId,
    );
    set({ nodes: afterNodes, edges: afterEdges });
    useUndoRedoStore.getState().push({
      undo: () => set({ nodes: beforeNodes, edges: beforeEdges }),
      redo: () => set({ nodes: afterNodes, edges: afterEdges }),
    });
  },

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node,
      ),
    });
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
}));
