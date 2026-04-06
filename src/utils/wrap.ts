import { startTimer } from "../core/measure.js";
import { getInstance } from "../core/nodeye.js";

export async function wrap<T>(
    label: string,
    fn: () => Promise<T> | T
): Promise<T> {
    const cfg = getInstance().config;
    const done = startTimer(cfg, "custom", label);
    try {
        const result = await fn();
        done();
        return result;
    } catch (err) {
        done();
        throw err;
    }
}