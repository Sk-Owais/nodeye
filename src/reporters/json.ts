import type { PerfEvent } from "../core/types.js";

export function jsonReporter(event: PerfEvent): void {
  process.stdout.write(JSON.stringify(event) + "\n");
}