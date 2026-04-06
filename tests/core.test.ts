import { describe, it, expect, beforeEach, vi } from "vitest";
import { init, getInstance, _reset } from "../src/core/nodeye.js";
import { startTimer }               from "../src/core/measure.js";
import { subscribe }                from "../src/core/bus.js";
import type { PerfEvent }           from "../src/core/types.js";

beforeEach(() => _reset());

describe("init()", () => {
  it("returns instance with resolved config", () => {
    const eye = init({ thresholds: { http: 50 } });
    expect(eye.config.thresholds.http).toBe(50);
    expect(eye.config.thresholds.mongodb).toBe(100);
  });

  it("warns and returns same instance on double init", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const a = init();
    const b = init();
    expect(a).toBe(b);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it("getInstance() throws before init()", () => {
    expect(() => getInstance()).toThrow("[nodeye]");
  });
});

describe("startTimer / bus", () => {
  it("emits event when duration exceeds threshold", async () => {
    const eye = init({ thresholds: { custom: 5 }, slowOnly: false });
    const events: PerfEvent[] = [];
    subscribe((e) => events.push(e));

    const done = startTimer(eye.config, "custom", "test-fn");
    await new Promise((r) => setTimeout(r, 20));
    done();

    expect(events).toHaveLength(1);
    expect(events[0]!.slow).toBe(true);
    expect(events[0]!.durationMs).toBeGreaterThan(5);
  });

  it("does NOT emit when disabled", async () => {
    const eye = init({ enabled: false });
    const events: PerfEvent[] = [];
    subscribe((e) => events.push(e));

    const done = startTimer(eye.config, "custom", "test-fn");
    await new Promise((r) => setTimeout(r, 10));
    done();

    expect(events).toHaveLength(0);
  });

  it("does NOT emit fast events when slowOnly: true", () => {
    const eye = init({ thresholds: { custom: 999 } });
    const events: PerfEvent[] = [];
    subscribe((e) => events.push(e));

    startTimer(eye.config, "custom", "fast-fn")();
    expect(events).toHaveLength(0);
  });
});

describe("reporters", () => {
  it("reporter crash does NOT propagate to host", () => {
    const bad = () => { throw new Error("boom"); };
    const eye = init({ reporters: bad, thresholds: { custom: 0 }, slowOnly: false });
    const done = startTimer(eye.config, "custom", "x");
    expect(() => done()).not.toThrow();
  });
});