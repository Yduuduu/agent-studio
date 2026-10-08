import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUndoRedoStore } from "./useUndoRedo";

const store = () => useUndoRedoStore.getState();

function entry() {
  return { undo: vi.fn(), redo: vi.fn() };
}

beforeEach(() => store().clear());

describe("useUndoRedoStore", () => {
  it("moves entries between past and future on undo/redo", () => {
    const first = entry();
    store().push(first);

    store().undo();
    expect(first.undo).toHaveBeenCalledOnce();
    expect(store().past).toHaveLength(0);
    expect(store().future).toHaveLength(1);

    store().redo();
    expect(first.redo).toHaveBeenCalledOnce();
    expect(store().past).toHaveLength(1);
    expect(store().future).toHaveLength(0);
  });

  it("clears the redo stack when a new entry is pushed", () => {
    store().push(entry());
    store().undo();
    store().push(entry());

    expect(store().future).toHaveLength(0);
  });

  it("is a no-op when there is nothing to undo or redo", () => {
    expect(() => {
      store().undo();
      store().redo();
    }).not.toThrow();
  });

  it("caps history at 200 entries, dropping the oldest", () => {
    const entries = Array.from({ length: 201 }, entry);
    for (const e of entries) store().push(e);

    expect(store().past).toHaveLength(200);
    expect(store().past[0]).toBe(entries[1]);
  });
});
