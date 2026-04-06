import { resolveConfig } from "./config.js";
import { wireReporters, _resetBus } from "./bus.js";
import { patchAxios } from "../monitors/axios.js";
import { patchMongoose } from "../monitors/mongoose.js";
import { patchIoRedis } from "../monitors/ioredis.js";
import type { NodeyeConfig, ResolvedConfig } from "./types.js";

export interface NodeyeInstance {
  readonly config: ResolvedConfig;
  destroy(): void;
}

let _instance: NodeyeInstance | null = null;
let _cleanup: (() => void) | null = null;

export function init(userConfig: NodeyeConfig = {}): NodeyeInstance {
  if (_instance) {
    console.warn("[nodeye] init() called more than once — ignoring.");
    return _instance;
  }

  const config = resolveConfig(userConfig);

  if (!config.enabled) {
    _instance = { config, destroy() { } };
    return _instance;
  }

  const unwireReporters = wireReporters(config);

  const monitorCleanups = [
    patchAxios(config),      // pass nothing — CJS auto-detect
    patchMongoose(config),
    patchIoRedis(config),
  ];

  _instance = {
    config,
    destroy() {
      monitorCleanups.forEach((fn) => fn());
      unwireReporters();
      _instance = null;
      _cleanup = null;
    },
  };

  _cleanup = _instance.destroy;
  process.once("exit", () => _cleanup?.());
  return _instance;
}

export function getInstance(): NodeyeInstance {
  if (!_instance) throw new Error("[nodeye] Call init() before using nodeye.");
  return _instance;
}

export function _reset(): void {
  _resetBus();
  _instance = null;
  _cleanup = null;
}