"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "./store";

/**
 * VocaVision's `stableQuery` pattern, ported to HangeulVision.
 *
 * Why it exists
 * --------------
 * Zustand selectors return a new object on every render unless carefully
 * memoised. For dashboards that derive 8-10 aggregates from the same slice
 * of state this turns into a re-render storm — every navigation or grade
 * repaints every card. `stableQuery` fixes this by:
 *
 *   1. Running the selector only when the underlying store signature changes
 *      (shallow-equality check of the raw inputs).
 *   2. Caching the derived result with a deep-equal guard so consumers only
 *      see a new reference when the value actually changed.
 *   3. Deferring the first compute to `useEffect` so SSR and client agree on
 *      initial markup (prevents hydration mismatches when localStorage is
 *      the source of truth).
 */
export function stableQuery<Inputs extends unknown[], Result>(
  selectInputs: (s: ReturnType<typeof useStore.getState>) => Inputs,
  compute: (inputs: Inputs) => Result,
  fallback: Result,
): Result {
  const inputs = useStore(selectInputs);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const inputsRef = useRef<Inputs | null>(null);
  const resultRef = useRef<Result>(fallback);

  if (hydrated && !shallowEqual(inputsRef.current, inputs)) {
    const next = compute(inputs);
    if (!deepEqual(resultRef.current, next)) resultRef.current = next;
    inputsRef.current = inputs;
  }

  return hydrated ? resultRef.current : fallback;
}

function shallowEqual<T extends unknown[] | null>(a: T, b: T): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a && b && typeof a === "object") {
    const ka = Object.keys(a as object);
    const kb = Object.keys(b as object);
    if (ka.length !== kb.length) return false;
    for (const k of ka) {
      if (!deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])) {
        return false;
      }
    }
    return true;
  }
  return false;
}
