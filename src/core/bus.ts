import type { PerfEvent, ResolvedConfig } from "./types.js";

type Subscriber = (event: PerfEvent) => void;
let subscribers: Subscriber[] = [];  // `let` not `const` so we can reset

export function subscribe(fn: Subscriber): () => void {
  subscribers.push(fn);
  return () => {
    const i = subscribers.indexOf(fn);
    if (i !== -1) subscribers.splice(i, 1);
  };
}

export function emit(event: PerfEvent): void {
  for (let i = 0; i < subscribers.length; i++) {
    try { subscribers[i]!(event); } catch { /* reporters must never crash host */ }
  }
}

export function wireReporters(cfg: ResolvedConfig): () => void {
  const unsubs = cfg.reporters.map((r) => subscribe(r));
  return () => unsubs.forEach((u) => u());
}

export function _resetBus(): void {
  subscribers = [];
}