import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getBackoffDelay, useSSE } from "./useSSE";

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  closed = false;
  private listeners = new Map<string, () => void>();

  constructor(public url: string) {
    FakeEventSource.instances.push(this);
  }
  addEventListener(type: string, listener: () => void) {
    this.listeners.set(type, listener);
  }
  close() {
    this.closed = true;
  }

  open() {
    act(() => this.onopen?.());
  }
  emit(data: string) {
    act(() => this.onmessage?.({ data } as MessageEvent<string>));
  }
  fail() {
    act(() => this.onerror?.(new Event("error")));
  }
  end() {
    act(() => this.listeners.get("end")?.());
  }
}

const latest = () => FakeEventSource.instances.at(-1)!;

beforeEach(() => {
  FakeEventSource.instances = [];
  vi.stubGlobal("EventSource", FakeEventSource);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("getBackoffDelay", () => {
  it("doubles per attempt and caps at the max", () => {
    expect([0, 1, 2, 3, 4].map((n) => getBackoffDelay(n, 500, 4000))).toEqual([
      500, 1000, 2000, 4000, 4000,
    ]);
  });
});

describe("useSSE", () => {
  it("parses JSON messages, skips malformed ones, and reports status", () => {
    const onMessage = vi.fn();
    const { result } = renderHook(() => useSSE({ url: "/stream", onMessage }));

    expect(result.current.status).toBe("connecting");
    latest().open();
    expect(result.current.status).toBe("open");

    latest().emit('{"n":1}');
    latest().emit("not json");
    latest().emit('{"n":2}');
    expect(onMessage.mock.calls).toEqual([[{ n: 1 }], [{ n: 2 }]]);
  });

  it("does not connect while disabled", () => {
    const { result } = renderHook(() =>
      useSSE({ url: "/stream", onMessage: vi.fn(), enabled: false }),
    );
    expect(FakeEventSource.instances).toHaveLength(0);
    expect(result.current.status).toBe("idle");
  });

  it("reconnects with exponential backoff, then fails after maxRetries", () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useSSE({ url: "/stream", onMessage: vi.fn(), onError, maxRetries: 2, baseDelayMs: 100 }),
    );

    latest().fail();
    expect(latest().closed).toBe(true);
    expect(result.current.status).toBe("reconnecting");

    act(() => vi.advanceTimersByTime(99));
    expect(FakeEventSource.instances).toHaveLength(1);
    act(() => vi.advanceTimersByTime(1));
    expect(FakeEventSource.instances).toHaveLength(2);

    latest().fail();
    act(() => vi.advanceTimersByTime(200));
    expect(FakeEventSource.instances).toHaveLength(3);

    latest().fail();
    expect(result.current.status).toBe("failed");
    expect(onError).toHaveBeenCalledTimes(3);

    act(() => vi.advanceTimersByTime(60_000));
    expect(FakeEventSource.instances).toHaveLength(3);
  });

  it("resets the backoff after a successful reconnect", () => {
    renderHook(() => useSSE({ url: "/stream", onMessage: vi.fn(), baseDelayMs: 100 }));

    latest().fail();
    act(() => vi.advanceTimersByTime(100));
    latest().open();
    latest().fail();

    act(() => vi.advanceTimersByTime(100));
    expect(FakeEventSource.instances).toHaveLength(3);
  });

  it("retry() starts a fresh connection after failure", () => {
    const { result } = renderHook(() =>
      useSSE({ url: "/stream", onMessage: vi.fn(), maxRetries: 0 }),
    );
    latest().fail();
    expect(result.current.status).toBe("failed");

    act(() => result.current.retry());
    expect(FakeEventSource.instances).toHaveLength(2);
    expect(result.current.status).toBe("connecting");
  });

  it("closes on the server's end event without reconnecting", () => {
    const { result } = renderHook(() => useSSE({ url: "/stream", onMessage: vi.fn() }));
    latest().open();
    latest().end();

    expect(latest().closed).toBe(true);
    expect(result.current.status).toBe("closed");
    act(() => vi.advanceTimersByTime(60_000));
    expect(FakeEventSource.instances).toHaveLength(1);
  });

  it("closes the source and cancels pending retries on unmount", () => {
    const { unmount } = renderHook(() => useSSE({ url: "/stream", onMessage: vi.fn() }));
    latest().fail();
    unmount();

    act(() => vi.advanceTimersByTime(60_000));
    expect(FakeEventSource.instances).toHaveLength(1);
  });

  it("uses the latest onMessage without reconnecting", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ onMessage }) => useSSE({ url: "/stream", onMessage }), {
      initialProps: { onMessage: first },
    });

    rerender({ onMessage: second });
    latest().emit("1");

    expect(FakeEventSource.instances).toHaveLength(1);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(1);
  });

  it("reconnects when the url changes", () => {
    const { rerender } = renderHook(({ url }) => useSSE({ url, onMessage: vi.fn() }), {
      initialProps: { url: "/a" },
    });
    rerender({ url: "/b" });

    expect(FakeEventSource.instances.map((source) => [source.url, source.closed])).toEqual([
      ["/a", true],
      ["/b", false],
    ]);
  });
});
