import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { useNodeSelectionStore } from "@/hooks/useNodeSelection";
import { useUndoRedoStore } from "@/hooks/useUndoRedo";
import { useCanvasStore } from "@/store/useCanvasStore";

import { NodeSettingsDrawer } from "./NodeSettingsDrawer";

const nodeData = () => useCanvasStore.getState().nodes[0]?.data;

beforeEach(() => {
  useUndoRedoStore.getState().clear();
  useNodeSelectionStore.setState({ editingNodeId: null });
  useCanvasStore.setState({
    edges: [],
    nodes: [
      {
        id: "llm-1",
        type: "llm",
        position: { x: 0, y: 0 },
        data: { label: "Summarize", kind: "llm", status: "idle" },
      },
    ],
  });
});

describe("NodeSettingsDrawer", () => {
  it("stays closed until a node is opened", () => {
    render(<NodeSettingsDrawer />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    act(() => useNodeSelectionStore.getState().openNode("llm-1"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Label")).toHaveValue("Summarize");
  });

  it("saves label + validated config to the node, undoably", async () => {
    const user = userEvent.setup();
    render(<NodeSettingsDrawer />);
    act(() => useNodeSelectionStore.getState().openNode("llm-1"));

    await user.clear(screen.getByLabelText("Label"));
    await user.type(screen.getByLabelText("Label"), "Draft reply");
    await user.type(screen.getByLabelText("Model"), "claude-opus-5-5");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(nodeData()).toMatchObject({
      label: "Draft reply",
      config: {
        provider: "anthropic",
        model: "claude-opus-5-5",
        temperature: 1,
        retry: { policy: { maxAttempts: 3, backoff: "exponential" } },
      },
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    act(() => useUndoRedoStore.getState().undo());
    expect(nodeData()).toMatchObject({ label: "Summarize" });
    expect(nodeData()?.config).toBeUndefined();
  });

  it("does not save while the config is invalid", async () => {
    const user = userEvent.setup();
    render(<NodeSettingsDrawer />);
    act(() => useNodeSelectionStore.getState().openNode("llm-1"));

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Model is required")).toBeInTheDocument();
    expect(nodeData()?.config).toBeUndefined();
    expect(useUndoRedoStore.getState().past).toHaveLength(0);
  });

  it("closes when the edited node is deleted", () => {
    render(<NodeSettingsDrawer />);
    act(() => useNodeSelectionStore.getState().openNode("llm-1"));
    act(() => useCanvasStore.getState().removeNode("llm-1"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
