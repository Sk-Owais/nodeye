import { startTimer } from "../core/measure.js";
import type { ResolvedConfig } from "../core/types.js";

export function patchMongoose(cfg: ResolvedConfig, mongooseInstance?: any): () => void {
    if (!cfg.monitors.mongodb) return noop;

    let mongoose = mongooseInstance;

    if (!mongoose) {
        try {
            const mod = require("mongoose");
            mongoose = mod.default ?? mod;
        } catch {
            return noop;
        }
    }

    const Query = mongoose.Query;
    const Aggregate = mongoose.Aggregate;
    if (!Query || !Aggregate) return noop;

    const origQueryExec = Query.prototype.exec;
    Query.prototype.exec = function patchedExec(this: any, ...args: any[]) {
        const op = this.op ?? "query";
        const collection = this.mongooseCollection?.name ?? "unknown";
        const label = `${collection}.${op}`;
        const meta = cfg.captureArgs
            ? { filter: this._conditions, update: this._update }
            : undefined;

        const done = startTimer(cfg, "mongodb", label, meta);
        const result = origQueryExec.apply(this, args);

        if (result && typeof result.then === "function") {
            return result.then(
                (v: any) => { done(); return v; },
                (e: any) => { done(); return Promise.reject(e); }
            );
        }
        done();
        return result;
    };

    const origAggExec = Aggregate.prototype.exec;
    Aggregate.prototype.exec = function patchedAggExec(this: any, ...args: any[]) {
        const collection = this._model?.collection?.name ?? "unknown";
        const label = `${collection}.aggregate`;
        const done = startTimer(cfg, "mongodb", label);
        const result = origAggExec.apply(this, args);

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
        Query.prototype.exec = origQueryExec;
        Aggregate.prototype.exec = origAggExec;
    };
}

function noop() { }