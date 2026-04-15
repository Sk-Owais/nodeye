import { startTimer } from "../core/measure.js";
import { getInstance } from "../core/nodeye.js";

export async function wrap<T>(
  label: string,
  fn: () => Promise<T> | T,
): Promise<T> {
  const cfg = getInstance().config;
  const done = startTimer(cfg, "custom", label);
  try {
    const result = await fn();
    try {
      done();
    } catch {
      /* reporter errors must never surface to caller */
    }
    return result;
  } catch (err) {
    try {
      done();
    } catch {
      /* same guard on the error path */
    }
    throw err;
  }
}
