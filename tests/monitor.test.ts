import { describe, it, expect, beforeEach } from "vitest";
import { init, _reset } from "../src/core/nodeye.js";
import { subscribe } from "../src/core/bus.js";
import { patchAxios } from "../src/monitors/axios.js";
import { patchMongoose } from "../src/monitors/mongoose.js";
import type { PerfEvent } from "../src/core/types.js";

beforeEach(() => _reset());

describe("axios monitor", () => {
  it("fires an http event on a successful request", async () => {
    const axios = (await import("axios")).default;
    const eye = init({ thresholds: { http: 0 }, slowOnly: false });
    const events: PerfEvent[] = [];
    subscribe((e) => events.push(e));

    patchAxios(eye.config, axios);

    await axios.get("https://example.com/test", {
      adapter: async (config: any) => ({
        data: {},
        status: 200,
        statusText: "OK",
        headers: {},
        config,
        request: {},
      }),
    });

    const httpEvents = events.filter((e) => e.category === "http");
    expect(httpEvents.length).toBeGreaterThanOrEqual(1);
    expect(httpEvents[0]!.label).toContain("example.com");
  });
});

describe("mongoose monitor", () => {
  it("patches Query.prototype.exec", async () => {
    const mongoose = (await import("mongoose")).default;
    const eye = init({ thresholds: { mongodb: 0 }, slowOnly: false });
    const events: PerfEvent[] = [];
    subscribe((e) => events.push(e));

    patchMongoose(eye.config, mongoose);

    const execStr = mongoose.Query.prototype.exec.toString();
    expect(execStr).toContain("patchedExec");

    const origExec = mongoose.Query.prototype.exec;
    mongoose.Query.prototype.exec = async function (this: any) {
      const done = startTimerFromQuery(eye.config, this);
      done();
      return [];
    };

    mongoose.Query.prototype.exec = origExec;
  });

  it("fires mongodb event when exec resolves", async () => {
    const mongoose = (await import("mongoose")).default;
    const eye = init({ thresholds: { mongodb: 0 }, slowOnly: false });
    const events: PerfEvent[] = [];
    subscribe((e) => events.push(e));

    mongoose.Query.prototype.exec = async function (this: any) {
      return [];
    };

    patchMongoose(eye.config, mongoose);

    const TestModel = (() => {
      try {
        return mongoose.model("NodyeTest2");
      } catch {
        return mongoose.model(
          "NodyeTest2",
          new mongoose.Schema({ name: String }),
          "t",
        );
      }
    })();

    await TestModel.findOne({ name: "x" }).exec();

    const dbEvents = events.filter((e) => e.category === "mongodb");
    expect(dbEvents.length).toBeGreaterThanOrEqual(1);
    expect(dbEvents[0]!.label).toContain("findOne");
  });
});

describe("ioredis monitor", () => {
  it("patches sendCommand and fires redis event", async () => {
    const Redis = (await import("ioredis")).default;
    const eye = init({ thresholds: { redis: 0 }, slowOnly: false });
    const events: PerfEvent[] = [];
    subscribe((e) => events.push(e));

    const client = new Redis({ lazyConnect: true, enableOfflineQueue: false });
    await client.get("some-key").catch(() => {});

    const redisEvents = events.filter((e) => e.category === "redis");
    expect(redisEvents.length).toBeGreaterThanOrEqual(1);
    expect(redisEvents[0]!.label).toBe("redis.get");

    client.disconnect();
  });
});

import { startTimer } from "../src/core/measure.js";
import type { ResolvedConfig } from "../src/core/types.js";
function startTimerFromQuery(cfg: ResolvedConfig, query: any) {
  const op = query.op ?? "query";
  const collection = query.mongooseCollection?.name ?? "unknown";
  return startTimer(cfg, "mongodb", `${collection}.${op}`);
}
