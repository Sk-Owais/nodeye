import type { NodeyeConfig, ResolvedConfig } from "./types.js";
import { consoleReporter } from "../reporters/console.js";

const DEFAULT_MS = 100;

export function resolveConfig(user: NodeyeConfig = {}): ResolvedConfig {
  const reporters = user.reporters
    ? Array.isArray(user.reporters) ? user.reporters : [user.reporters]
    : [consoleReporter];

  return {
    enabled: user.enabled ?? true,
    slowOnly: user.slowOnly ?? true,
    captureArgs: user.captureArgs ?? false,
    captureStack: user.captureStack ?? false,
    sampleRate: user.sampleRate ?? 1,
    thresholds: {
      mongodb: user.thresholds?.mongodb ?? DEFAULT_MS,
      sql: user.thresholds?.sql ?? DEFAULT_MS,
      redis: user.thresholds?.redis ?? DEFAULT_MS,
      http: user.thresholds?.http ?? DEFAULT_MS,
      queue: user.thresholds?.queue ?? DEFAULT_MS,
      custom: user.thresholds?.custom ?? DEFAULT_MS,
    },
    monitors: {
      mongodb: user.monitors?.mongodb ?? true,
      sql: user.monitors?.sql ?? true,
      redis: user.monitors?.redis ?? true,
      http: user.monitors?.http ?? true,
      queue: user.monitors?.queue ?? true,
      custom: user.monitors?.custom ?? true,  // ← add this
    },
    reporters,
  };
}