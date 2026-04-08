export type MonitorCategory =
  | "mongodb"
  | "sql"
  | "redis"
  | "http"
  | "queue"
  | "custom";

export interface PerfEvent {
  category: MonitorCategory;
  label: string;
  durationMs: number;
  timestamp: number;
  slow: boolean;
  meta?: Record<string, unknown>;
  stack?: string;
}

export interface ThresholdConfig {
  mongodb?: number;
  sql?: number;
  redis?: number;
  http?: number;
  queue?: number;
  custom?: number;
}

export interface ReporterFn {
  (event: PerfEvent): void;
}

export interface NodeyeConfig {
  enabled?: boolean;
  thresholds?: ThresholdConfig;
  slowOnly?: boolean;
  captureArgs?: boolean;
  captureStack?: boolean;
  sampleRate?: number;
  monitors?: {
    mongodb?: boolean;
    sql?: boolean;
    redis?: boolean;
    http?: boolean;
    queue?: boolean;
    custom?: boolean;
  };
  reporters?: ReporterFn | ReporterFn[];
}

export interface ResolvedConfig {
  enabled: boolean;
  thresholds: Required<ThresholdConfig>;
  slowOnly: boolean;
  captureArgs: boolean;
  captureStack: boolean;
  sampleRate: number;
  monitors: Required<Required<NodeyeConfig>["monitors"]>;
  reporters: ReporterFn[];
}
