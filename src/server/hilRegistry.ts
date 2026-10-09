import type { HILDecision } from "@/types/log.types";

// Pending human-in-the-loop decisions for in-flight mock runs. Kept on
// globalThis so the stream route and the decision route share one map even
// when the dev server bundles them as separate module instances.

type Resolver = (decision: HILDecision) => void;

const globalForHIL = globalThis as typeof globalThis & {
  __hilPending?: Map<string, Resolver>;
};
const pending = (globalForHIL.__hilPending ??= new Map<string, Resolver>());

/** Resolves with the operator's decision, or null if the run is aborted first. */
export function waitForDecision(requestId: string, signal?: AbortSignal) {
  return new Promise<HILDecision | null>((resolve) => {
    if (signal?.aborted) return resolve(null);
    pending.set(requestId, resolve);
    signal?.addEventListener("abort", () => {
      pending.delete(requestId);
      resolve(null);
    });
  });
}

/** Returns false when no run is waiting on `requestId` (unknown, resolved or aborted). */
export function submitDecision(requestId: string, decision: HILDecision) {
  const resolve = pending.get(requestId);
  if (!resolve) return false;
  pending.delete(requestId);
  resolve(decision);
  return true;
}
