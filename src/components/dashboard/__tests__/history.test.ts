import { describe, expect, it } from "vitest";
import { historyReducer, sameTools, MAX_HISTORY, type HistoryState } from "@/components/dashboard/history";
import type { SaasTool } from "@/lib/persistence.functions";

const tool = (name: string, cost = 10): SaasTool => ({
  id: Math.random().toString(36).slice(2),
  name,
  category: "Communication",
  cost,
  users: 1,
  usage: 100,
});

const init = (present: SaasTool[] = []): HistoryState => ({ past: [], present, future: [] });

describe("sameTools", () => {
  it("ignores row ids when comparing", () => {
    expect(sameTools([tool("slack")], [tool("slack")])).toBe(true);
  });
  it("detects a real value change", () => {
    expect(sameTools([tool("slack", 10)], [tool("slack", 12)])).toBe(false);
    expect(sameTools([tool("slack")], [])).toBe(false);
  });
});

describe("historyReducer", () => {
  it("does not push history when the new value is equivalent (e.g. Load Demo twice)", () => {
    const demo = [tool("slack"), tool("figma")];
    let s = init();
    s = historyReducer(s, { type: "set", value: demo });
    const afterFirst = s;
    s = historyReducer(s, { type: "set", value: [tool("slack"), tool("figma")] });
    expect(s).toBe(afterFirst); // identical state object → no history entry
    expect(s.past).toHaveLength(1);
  });

  it("replace resets history without a push (initial load)", () => {
    let s = init([tool("a")]);
    s = historyReducer(s, { type: "set", value: [tool("b")] });
    s = historyReducer(s, { type: "replace", value: [tool("c")] });
    expect(s.past).toEqual([]);
    expect(s.future).toEqual([]);
    expect(s.present[0].name).toBe("c");
  });

  it("undo takes effect in a single step", () => {
    let s = init([tool("a")]);
    s = historyReducer(s, { type: "set", value: [tool("b")] });
    s = historyReducer(s, { type: "undo" });
    expect(s.present[0].name).toBe("a");
    expect(s.future).toHaveLength(1);
  });

  it("redo restores the undone value in a single step", () => {
    let s = init([tool("a")]);
    s = historyReducer(s, { type: "set", value: [tool("b")] });
    s = historyReducer(s, { type: "undo" });
    s = historyReducer(s, { type: "redo" });
    expect(s.present[0].name).toBe("b");
    expect(s.future).toHaveLength(0);
    expect(s.past).toHaveLength(1);
  });

  it("undo/redo at the boundaries are no-ops (buttons stay disabled)", () => {
    const s = init([tool("a")]);
    expect(historyReducer(s, { type: "undo" })).toBe(s);
    expect(historyReducer(s, { type: "redo" })).toBe(s);
    expect(s.past.length === 0).toBe(true);
    expect(s.future.length === 0).toBe(true);
  });

  it("a new edit after undo clears the redo stack", () => {
    let s = init([tool("a")]);
    s = historyReducer(s, { type: "set", value: [tool("b")] });
    s = historyReducer(s, { type: "undo" });
    s = historyReducer(s, { type: "set", value: [tool("c")] });
    expect(s.future).toEqual([]);
    expect(s.present[0].name).toBe("c");
  });

  it("caps the history stack", () => {
    let s = init();
    for (let i = 0; i < MAX_HISTORY + 10; i++) {
      s = historyReducer(s, { type: "set", value: [tool("t", i)] });
    }
    expect(s.past.length).toBeLessThanOrEqual(MAX_HISTORY);
  });
});
