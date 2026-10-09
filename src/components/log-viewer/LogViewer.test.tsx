import { act, render, screen } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { useCanvasStore } from "@/store/useCanvasStore";
import { useLogStore } from "@/store/useLogStore";
import type { LogEntry } from "@/types/log.types";

import { isNearBottom } from "./log-viewer.utils";
import { LogViewer } from "./LogViewer";

function log(n: number, extra: Partial<LogEntry> = {}): LogEntry {
  return {
    type: "log",
    id: `l${n}`,
    timestamp: n,
    level: "info",
    message: `line ${n}`,
    ...extra,
  } as LogEntry;
}

function seed(entries: LogEntry[]) {
  act(() => {
    for (const entry of entries) useLogStore.getState().enqueue(entry);
    useLogStore.getState().flush();
  });
}

// jsdom has no layout; give elements a viewport-sized box so the
// virtualizer has a window to fill.
const originalSize = {
  offsetHeight: Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight"),
  offsetWidth: Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth"),
};

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, value: 320 });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, value: 800 });
});

afterAll(() => {
  for (const [key, descriptor] of Object.entries(originalSize)) {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, key, descriptor);
  }
});

beforeEach(() => {
  useLogStore.getState().clear();
  useCanvasStore.setState({ nodes: [], edges: [] });
});

describe("isNearBottom", () => {
  it("treats positions within the threshold as following", () => {
    expect(isNearBottom({ scrollTop: 680, scrollHeight: 1000, clientHeight: 300 })).toBe(true);
    expect(isNearBottom({ scrollTop: 600, scrollHeight: 1000, clientHeight: 300 })).toBe(false);
  });
});

describe("LogViewer", () => {
  it("shows an empty state before any logs arrive", () => {
    render(<LogViewer />);
    expect(screen.getByText(/No logs yet/)).toBeInTheDocument();
  });

  it("virtualizes: renders only a window of rows out of thousands", () => {
    render(<LogViewer />);
    seed(Array.from({ length: 5000 }, (_, i) => log(i)));

    expect(screen.getByText("5000 lines")).toBeInTheDocument();
    const rendered = screen.getByRole("log").querySelectorAll("[data-index]");
    expect(rendered.length).toBeGreaterThan(0);
    expect(rendered.length).toBeLessThan(60);
  });

  it("resolves node labels and renders HIL requests distinctly", () => {
    useCanvasStore.setState({
      nodes: [
        {
          id: "n1",
          type: "condition",
          position: { x: 0, y: 0 },
          data: { label: "Needs Approval?", kind: "condition", status: "idle" },
        },
      ],
    });
    render(<LogViewer />);
    seed([
      log(1, { nodeId: "n1" }),
      {
        type: "hil_request",
        id: "h",
        timestamp: 2,
        requestId: "r",
        message: "Approve?",
        resolution: "pending",
      },
    ]);

    expect(screen.getByText("Needs Approval?")).toBeInTheDocument();
    expect(screen.getByText("Awaiting approval")).toBeInTheDocument();
  });

  it("does not show the jump button while following", () => {
    render(<LogViewer />);
    seed([log(1)]);
    expect(screen.queryByRole("button", { name: "Jump to latest" })).not.toBeInTheDocument();
  });
});
