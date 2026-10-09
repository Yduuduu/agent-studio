import { create } from "zustand";

import { useCanvasStore } from "@/store/useCanvasStore";

interface NodeSelectionState {
  /** Node whose settings drawer is open. Independent of React Flow's multi-select. */
  editingNodeId: string | null;
  openNode: (nodeId: string) => void;
  close: () => void;
}

export const useNodeSelectionStore = create<NodeSelectionState>((set) => ({
  editingNodeId: null,
  openNode: (nodeId) => set({ editingNodeId: nodeId }),
  close: () => set({ editingNodeId: null }),
}));

/**
 * The node currently being edited, or undefined if none — including when the
 * node was deleted (or undone away) while its drawer was open.
 */
export function useEditingNode() {
  const editingNodeId = useNodeSelectionStore((state) => state.editingNodeId);
  return useCanvasStore((state) =>
    editingNodeId ? state.nodes.find((node) => node.id === editingNodeId) : undefined,
  );
}
