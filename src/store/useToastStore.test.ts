import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useToastStore } from "./useToastStore";

const store = () => useToastStore.getState();

beforeEach(() => {
  vi.useFakeTimers();
  useToastStore.setState({ toasts: [] });
});

afterEach(() => vi.useRealTimers());

describe("useToastStore", () => {
  it("shows a toast and auto-dismisses it after the duration", () => {
    store().show({ title: "Saved", durationMs: 1000 });
    expect(store().toasts).toHaveLength(1);
    expect(store().toasts[0]?.variant).toBe("info");

    vi.advanceTimersByTime(1000);
    expect(store().toasts).toHaveLength(0);
  });

  it("keeps a toast with durationMs 0 until dismissed manually", () => {
    const id = store().show({ title: "Sticky", durationMs: 0 });
    vi.advanceTimersByTime(60_000);
    expect(store().toasts).toHaveLength(1);

    store().dismiss(id);
    expect(store().toasts).toHaveLength(0);
  });
});
