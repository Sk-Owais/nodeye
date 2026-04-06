import type { PerfEvent } from "../core/types.js";

const COLORS: Record<string, string> = {
  mongodb: "\x1b[32m",
  sql: "\x1b[34m",
  redis: "\x1b[35m",
  http: "\x1b[36m",
  queue: "\x1b[33m",
  custom: "\x1b[37m",
};
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const RED = "\x1b[31m";

export function consoleReporter(event: PerfEvent): void {
  const color = COLORS[event.category] ?? "\x1b[37m";
  const badge = `${color}${BOLD}[nodeye:${event.category}]${RESET}`;
  const slow = event.slow ? ` ${RED}${BOLD}SLOW${RESET}` : "";
  const ms = `${BOLD}${event.durationMs.toFixed(2)}ms${RESET}`;
  const time = new Date(event.timestamp).toISOString().slice(11, 23);

  console.log(`${badge}${slow} ${event.label} — ${ms} @ ${time}`);
  if (event.meta) console.log(`  meta: ${JSON.stringify(event.meta)}`);
  if (event.stack) console.log(`  ${event.stack}`);
}