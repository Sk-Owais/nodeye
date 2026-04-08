import { emit } from "./bus.js";
import type { MonitorCategory, PerfEvent, ResolvedConfig } from "./types.js";

export function startTimer(
  cfg: ResolvedConfig,
  category: MonitorCategory,
  label: string,
  meta?: Record<string, unknown>,
): () => void {
  if (!cfg.enabled) return noop;
  if (cfg.sampleRate < 1 && Math.random() > cfg.sampleRate) return noop;
  if (
    category !== "custom" &&
    !cfg.monitors[category as keyof typeof cfg.monitors]
  )
    return noop;

  const start = performance.now();
  const timestamp = Date.now();

  const rawStack = cfg.captureStack ? new Error().stack : undefined;
  const stack = rawStack
    ? rawStack
        .split("\n")
        .filter(
          (line) => !line.includes("nodeye-js") && !line.includes("dist/index"),
        )
        .join("\n")
    : undefined;

  return function done() {
    const durationMs = performance.now() - start;
    const threshold = cfg.thresholds[category];
    const slow = durationMs >= threshold;

    if (cfg.slowOnly && !slow) return;

    const event: PerfEvent = {
      category,
      label,
      durationMs,
      timestamp,
      slow,
      ...(meta && cfg.captureArgs ? { meta } : {}),
      ...(stack && slow ? { stack } : {}),
    };

    emit(event);
  };
}

function noop() {}
