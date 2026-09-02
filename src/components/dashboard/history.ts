// Undo/redo history reducer for the SaaS Audit tool table.
// Extracted from the component so the transitions are unit testable.

import type { SaasTool } from "@/lib/persistence.functions";

export type HistoryState = { past: SaasTool[][]; present: SaasTool[]; future: SaasTool[][] };
export type HistoryAction =
  | { type: "set"; value: SaasTool[] }
  | { type: "replace"; value: SaasTool[] } // initial load: no history push
  | { type: "undo" }
  | { type: "redo" };

export const MAX_HISTORY = 50;

/** Deep equality on the meaningful fields only: row ids are ignored. */
export function sameTools(a: SaasTool[], b: SaasTool[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i];
    if (x.name !== y.name || x.category !== y.category || x.cost !== y.cost || x.users !== y.users || x.usage !== y.usage) return false;
  }
  return true;
}

export function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case "replace":
      return { past: [], present: action.value, future: [] };
    case "set": {
      if (sameTools(state.present, action.value)) return state; // no real change → no push
      const past = [...state.past, state.present];
      if (past.length > MAX_HISTORY) past.shift();
      return { past, present: action.value, future: [] };
    }
    case "undo": {
      if (state.past.length === 0) return state;
      const prev = state.past[state.past.length - 1];
      return { past: state.past.slice(0, -1), present: prev, future: [state.present, ...state.future] };
    }
    case "redo": {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return { past: [...state.past, state.present], present: next, future: state.future.slice(1) };
    }
    default:
      return state;
  }
}
