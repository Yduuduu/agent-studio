import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { useCanvasStore } from "@/store/useCanvasStore";
import { useLogStore } from "@/store/useLogStore";
import type { StreamEvent } from "@/types/log.types";

import Home from "./page";

// --- jsdom shims for React Flow + the virtualizer (no layout engine) -------

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class DOMMatrixReadOnlyStub {
  m22 = 1;
  constructor(transform?: string) {
    const scale = transform?.match(/scale\(([\d.]+)\)/)?.[1];
    if (scale) this.m22 = Number(scale);
  }
}

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  constructor(public url: string) {
    FakeEventSource.instances.push(this);
  }
  addEventListener() {}
  close() {}
  send(event: StreamEvent) {
    act(() => this.onmessage?.({ data: JSON.stringify(event) } as MessageEvent<string>));
  }
}

const sizeDescriptors = ["offsetHeight", "offsetWidth"].map(
  (key) => [key, Object.getOwnPropertyDescriptor(HTMLElement.prototype, key)] as const,
);

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, value: 320 });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, value: 800 });
});

afterAll(() => {
  for (const [key, descriptor] of sizeDescriptors) {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, key, descriptor);
  }
});

beforeEach(() => {
  FakeEventSource.instances = [];
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  vi.stubGlobal("DOMMatrixReadOnly", DOMMatrixReadOnlyStub);
  vi.stubGlobal("EventSource", FakeEventSource);
  useLogStore.getState().clear();
});

afterEach(() => vi.unstubAllGlobals());

describe("Workflow builder: canvas → settings form → run logs → HIL", () => {
  it("configures a node, streams a run, and approves the HIL gate", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    render(<Home />);

    // 1. Canvas → form: clicking a node opens its schema-driven settings.
    // fireEvent: user-event's mousedown has no `view` in jsdom, which d3-drag
    // (React Flow's drag handler) dereferences. Only the click matters here.
    fireEvent.click(await screen.findByText("Generate Response"));
    const drawer = await screen.findByRole("dialog");
    await user.type(within(drawer).getByLabelText("Model"), "claude-opus-5-5");
    await user.click(within(drawer).getByRole("button", { name: "Save" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(await screen.findByText("claude-opus-5-5")).toBeInTheDocument();

    // 2. Run → stream: events update node status and the log viewer.
    await user.click(screen.getByRole("button", { name: "Run" }));
    const source = FakeEventSource.instances.at(-1)!;
    expect(source.url).toContain("nodes=start-llm%2Cfetch-db%2Cbranch");
    expect(source.url).toContain("hil=branch");

    source.send({ type: "node_status", nodeId: "branch", status: "pending", progress: 100 });
    source.send({
      type: "log",
      id: "1",
      timestamp: Date.now(),
      level: "info",
      nodeId: "branch",
      message: "Evaluating approval rule",
    });
    source.send({
      type: "hil_request",
      id: "2",
      timestamp: Date.now(),
      workflowId: "demo",
      requestId: "req-1",
      nodeId: "branch",
      message: "Approve sending the response?",
    });

    const log = screen.getByRole("log");
    expect(await within(log).findByText("Evaluating approval rule")).toBeInTheDocument();
    expect(useCanvasStore.getState().nodes.find((n) => n.id === "branch")?.data.status).toBe(
      "pending",
    );

    // 3. HIL: approving is optimistic and posts the decision.
    await user.click(within(log).getByRole("button", { name: "Approve" }));
    expect(within(log).getByText("✓ Approved")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/workflows/demo/hil/req-1",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("rolls back a HIL decision and shows a toast when the server refuses", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: "No pending HIL request" }, { status: 404 })),
    );

    render(<Home />);
    await user.click(await screen.findByRole("button", { name: "Run" }));
    FakeEventSource.instances.at(-1)!.send({
      type: "hil_request",
      id: "h",
      timestamp: Date.now(),
      workflowId: "demo",
      requestId: "stale",
      message: "Approve?",
    });

    const log = screen.getByRole("log");
    await user.click(await within(log).findByRole("button", { name: "Reject" }));

    expect(await screen.findByText("Could not reject request")).toBeInTheDocument();
    await waitFor(() =>
      expect(within(log).getByRole("button", { name: "Reject" })).toBeInTheDocument(),
    );
  });
});
