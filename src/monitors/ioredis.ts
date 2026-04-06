import { startTimer } from "../core/measure.js";
import type { ResolvedConfig } from "../core/types.js";

// Commands worth tracking (covers 95% of real usage)
const TRACKED_COMMANDS = new Set([
    "get", "set", "del", "exists", "expire", "ttl", "persist",
    "hget", "hset", "hgetall", "hmset", "hdel", "hkeys", "hvals",
    "lpush", "rpush", "lpop", "rpop", "lrange", "llen",
    "sadd", "srem", "smembers", "sismember", "scard",
    "zadd", "zrem", "zrange", "zrangebyscore", "zcard", "zscore",
    "incr", "decr", "incrby", "decrby",
    "mget", "mset",
    "publish", "subscribe",
    "keys", "scan",
]);

export function patchIoRedis(cfg: ResolvedConfig): () => void {
    if (!cfg.monitors.redis) return noop;

    let Redis: any;
    try { Redis = require("ioredis"); } catch { return noop; }

    const proto = (Redis.default ?? Redis)?.prototype;
    if (!proto) return noop;

    const origSendCommand = proto.sendCommand;
    if (!origSendCommand) return noop;

    proto.sendCommand = function patchedSendCommand(this: any, command: any, ...rest: any[]) {
        const cmdName = (command?.name ?? command?.[0] ?? "cmd").toLowerCase();

        if (!TRACKED_COMMANDS.has(cmdName)) {
            return origSendCommand.apply(this, [command, ...rest]);
        }

        const label = `redis.${cmdName}`;
        const meta = cfg.captureArgs ? { args: command?.args } : undefined;
        const done = startTimer(cfg, "redis", label, meta);

        const result = origSendCommand.apply(this, [command, ...rest]);

        if (result && typeof result.then === "function") {
            return result.then(
                (v: any) => { done(); return v; },
                (e: any) => { done(); return Promise.reject(e); }
            );
        }
        done();
        return result;
    };

    return () => {
        proto.sendCommand = origSendCommand;
    };
}

function noop() { }