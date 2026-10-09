import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LogEntry } from "@/types/log.types";

import { MAX_LOGS, useLogStore } from "./useLogStore";

const store = () => useLogStore.getState();

function log(n: number): LogEntry {
  return { type: "log", id: `l${n}`, timestamp: n, level: "info", message: `line ${n}` };
}

beforeEach(() => {
  vi.useFakeTimers();
  store().clear();
});

afterEach(() => vi.useRealTimers());

describe("useLogStore", () => {
  it("batches enqueued entries into a single commit per frame", () => {
    const listener = vi.fn();
    const unsubscribe = useLogStore.subscribe(listener);

    for (let i = 0; i < 50; i++) store().enqueue(log(i));
    expect(store().logs).toHaveLength(0);
    expect(listener).not.toHaveBeenCalled();

    vi.advanceTimersToNextFrame();
    expect(store().logs).toHaveLength(50);
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it("produces a new array on each commit and keeps existing entries by reference", () => {
    store().enqueue(log(1));
    store().flush();
    const first = store().logs;

    store().enqueue(log(2));
    store().flush();
    expect(store().logs).not.toBe(first);
    expect(store().logs[0]).toBe(first[0]);
  });

  it(`caps history at ${MAX_LOGS} entries, dropping the oldest`, () => {
    for (let i = 0; i < MAX_LOGS + 5; i++) store().enqueue(log(i));
    store().flush();
    expect(store().logs).toHaveLength(MAX_LOGS);
    expect(store().logs[0]?.id).toBe("l5");
  });

  it("updates a HIL request's resolution by requestId", () => {
    store().enqueue({
      type: "hil_request",
      id: "h1",
      timestamp: 1,
      requestId: "req-1",
      message: "Approve?",
      resolution: "pending",
    });
    store().enqueue(log(2));
    store().flush();

    store().setHILResolution("req-1", "approved");
    expect(store().logs[0]).toMatchObject({ resolution: "approved" });
    expect(store().logs[1]).toEqual(log(2));
  });

  it("clear() drops buffered entries too", () => {
    store().enqueue(log(1));
    store().clear();
    vi.advanceTimersToNextFrame();
    expect(store().logs).toEqual([]);
  });
});
