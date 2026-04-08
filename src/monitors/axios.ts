import { startTimer } from "../core/measure.js";
import type { ResolvedConfig } from "../core/types.js";

export function patchAxios(
  cfg: ResolvedConfig,
  axiosInstance?: any,
): () => void {
  if (!cfg.monitors.http) return noop;

  let instance = axiosInstance;

  if (!instance) {
    try {
      const mod = require("axios");
      instance = mod.default ?? mod;
    } catch {
      return noop;
    }
  }

  if (!instance?.interceptors) return noop;

  const reqInterceptor = instance.interceptors.request.use((config: any) => {
    const label = `${(config.method ?? "GET").toUpperCase()} ${config.url ?? ""}`;
    const meta = cfg.captureArgs
      ? { method: config.method, url: config.url }
      : undefined;
    config.__nodeye_done__ = startTimer(cfg, "http", label, meta);
    return config;
  });

  const resInterceptor = instance.interceptors.response.use(
    (response: any) => {
      response.config?.__nodeye_done__?.();
      return response;
    },
    (error: any) => {
      error.config?.__nodeye_done__?.();
      return Promise.reject(error);
    },
  );

  return () => {
    instance.interceptors.request.eject(reqInterceptor);
    instance.interceptors.response.eject(resInterceptor);
  };
}

function noop() {}
