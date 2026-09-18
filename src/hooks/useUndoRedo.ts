import { create } from "zustand";

export interface HistoryEntry {
  undo: () => void;
  redo: () => void;
}

const MAX_HISTORY = 200;

interface UndoRedoState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  push: (entry: HistoryEntry) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

export const useUndoRedoStore = create<UndoRedoState>((set, get) => ({
  past: [],
  future: [],

  push: (entry) => {
    const nextPast = [...get().past, entry];
    if (nextPast.length > MAX_HISTORY) nextPast.shift();
    set({ past: nextPast, future: [] });
  },

  undo: () => {
    const { past, future } = get();
    const entry = past[past.length - 1];
    if (!entry) return;
    entry.undo();
    set({ past: past.slice(0, -1), future: [entry, ...future] });
  },

  redo: () => {
    const { past, future } = get();
    const entry = future[0];
    if (!entry) return;
    entry.redo();
    set({ past: [...past, entry], future: future.slice(1) });
  },

  clear: () => set({ past: [], future: [] }),
}));

export function useUndoRedo() {
  const push = useUndoRedoStore((state) => state.push);
  const undo = useUndoRedoStore((state) => state.undo);
  const redo = useUndoRedoStore((state) => state.redo);
  const canUndo = useUndoRedoStore((state) => state.past.length > 0);
  const canRedo = useUndoRedoStore((state) => state.future.length > 0);

  return { push, undo, redo, canUndo, canRedo };
}
