export { init, getInstance } from "./core/nodeye.js";
export { consoleReporter } from "./reporters/console.js";
export { jsonReporter } from "./reporters/json.js";
export { subscribe } from "./core/bus.js";
export { startTimer } from "./core/measure.js";
export { wrap } from "./utils/wrap.js";

export type {
  NodeyeConfig,
  ResolvedConfig,
  PerfEvent,
  MonitorCategory,
  ThresholdConfig,
  ReporterFn,
} from "./core/types.js";