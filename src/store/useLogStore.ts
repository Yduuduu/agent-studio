import { create } from "zustand";

import type { HILDecision, HILResolution, LogEntry } from "@/types/log.types";
import { submitHILDecision } from "@/utils/api";

/** Oldest entries are dropped past this, so a long run cannot grow memory unbounded. */
export const MAX_LOGS = 10_000;

interface LogState {
  logs: LogEntry[];
  /** Buffers an entry; buffered entries are committed together once per frame. */
  enqueue: (entry: LogEntry) => void;
  /** Commits the buffer immediately (also used by tests). */
  flush: () => void;
  setHILResolution: (requestId: string, resolution: HILResolution) => void;
  /**
   * Optimistically marks the request decided, then confirms with the server.
   * On failure the entry rolls back to "pending" and the error is rethrown.
   */
  decideHIL: (workflowId: string, requestId: string, decision: HILDecision) => Promise<void>;
  clear: () => void;
}

// The buffer lives outside the store: appending to it must not notify
// subscribers. Only flush() produces a new `logs` array.
let buffer: LogEntry[] = [];
let scheduled: (() => void) | null = null;

function scheduleFlush(flush: () => void) {
  if (scheduled) return;
  if (typeof requestAnimationFrame === "function") {
    const handle = requestAnimationFrame(() => flush());
    scheduled = () => cancelAnimationFrame(handle);
  } else {
    const handle = setTimeout(() => flush(), 16);
    scheduled = () => clearTimeout(handle);
  }
}

function cancelScheduledFlush() {
  scheduled?.();
  scheduled = null;
}

export const useLogStore = create<LogState>((set, get) => ({
  logs: [],

  enqueue: (entry) => {
    buffer.push(entry);
    scheduleFlush(get().flush);
  },

  flush: () => {
    cancelScheduledFlush();
    if (buffer.length === 0) return;
    const merged = get().logs.concat(buffer);
    buffer = [];
    set({ logs: merged.length > MAX_LOGS ? merged.slice(merged.length - MAX_LOGS) : merged });
  },

  setHILResolution: (requestId, resolution) =>
    set({
      logs: get().logs.map((entry) =>
        entry.type === "hil_request" && entry.requestId === requestId
          ? { ...entry, resolution }
          : entry,
      ),
    }),

  decideHIL: async (workflowId, requestId, decision) => {
    get().setHILResolution(requestId, decision);
    try {
      await submitHILDecision(workflowId, requestId, decision);
    } catch (error) {
      get().setHILResolution(requestId, "pending");
      throw error;
    }
  },

  clear: () => {
    cancelScheduledFlush();
    buffer = [];
    set({ logs: [] });
  },
}));
