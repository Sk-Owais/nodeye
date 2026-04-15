# nodeye 👁️

> Zero-config Node.js performance monitor. One line of code. See every slow query, HTTP call, and Redis command instantly.

[![npm version](https://img.shields.io/npm/v/nodeye-js.svg)](https://www.npmjs.com/package/nodeye-js)
[![license](https://img.shields.io/npm/l/nodeye-js.svg)](https://github.com/Sk-Owais/nodeye/blob/main/LICENSE)

## The problem

You have a slow API endpoint. Is it MongoDB? Redis? An axios call to a third-party service? You add `console.time()` everywhere, deploy, check logs, remove them, repeat. It's painful.

## The solution
```ts
import { init } from 'nodeye-js';
init();
```

That's it. nodeye auto-patches mongoose, axios, and ioredis. Every slow operation prints to your console immediately — no config, no agent, no cloud dashboard.

---

## Install
```bash
npm install nodeye-js
# or
pnpm add nodeye-js
# or
yarn add nodeye-js
```

---

## Quick start

### TypeScript / ESM
```ts
// At the very top of your entry file (index.ts, server.ts, app.ts)
import { init } from 'nodeye-js';

init();

// Everything below is auto-monitored — no other changes needed
import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
```

### JavaScript / CJS
```js
// At the very top of your entry file
const { init } = require('nodeye-js');

init();

// Everything below is auto-monitored
const mongoose = require('mongoose');
const axios = require('axios');
```

---

## What you see

When a slow operation is detected, nodeye logs it instantly:
```
[nodeye:mongodb] SLOW users.findOne — 243.12ms @ 14:32:01.443
[nodeye:http]    SLOW GET https://api.stripe.com/v1/charges — 891.34ms @ 14:32:02.112
[nodeye:redis]   SLOW redis.hgetall — 134.56ms @ 14:32:02.891
```

Fast operations are silent by default. You only see what's actually slow.

---

## Configuration
```ts
init({
  // Master kill switch — set false in production for zero overhead
  enabled: process.env.NODE_ENV !== 'production',

  // Per-category slow thresholds in ms (default: 100ms each)
  thresholds: {
    mongodb: 100,
    http:    300,
    redis:   50,
    queue:   500,
    custom:  100,
  },

  // Report all operations, not just slow ones (default: true)
  slowOnly: true,

  // Capture query args/URLs in output — disable in prod for privacy (default: false)
  captureArgs: false,

  // Attach stack trace to slow events for easier debugging (default: false)
  captureStack: false,

  // Sample rate 0–1, e.g. 0.1 = monitor 10% of calls (default: 1)
  sampleRate: 1,

  // Disable specific monitors
  monitors: {
    mongodb: true,
    http:    true,
    redis:   true,
    queue:   true,
  },
});
```

---

## Manual timing with `wrap()`

For any function not auto-patched:
```ts
import { wrap } from 'nodeye-js';

const users = await wrap('fetchUsersFromLegacyAPI', () =>
  legacyClient.getUsers()
);
```

Output:
```
[nodeye:custom] SLOW fetchUsersFromLegacyAPI — 412.00ms @ 14:33:10.001
```

---

## Custom reporters

### JSON (for log pipelines like Datadog, Loki, CloudWatch)
```ts
import { init, jsonReporter } from 'nodeye-js';

init({ reporters: jsonReporter });
```

Output:
```json
{"category":"mongodb","label":"users.findOne","durationMs":243.12,"timestamp":1718000000000,"slow":true}
```

### Webhook
```ts
init({
  reporters: (event) => {
    if (event.slow) {
      fetch('https://hooks.slack.com/your-webhook', {
        method: 'POST',
        body: JSON.stringify({ text: `🐢 SLOW: ${event.label} took ${event.durationMs.toFixed(0)}ms` }),
      });
    }
  }
});
```

### Multiple reporters
```ts
init({
  reporters: [consoleReporter, jsonReporter, myWebhookReporter]
});
```

---

## Auto-patched libraries

| Library | Category | Status |
|---|---|---|
| `axios` | http | ✅ v0.1 |
| `mongoose` | mongodb | ✅ v0.1 |
| `ioredis` | redis | ✅ v0.1 |
| `pg` | sql | 🔜 v0.2 |
| `mysql2` | sql | 🔜 v0.2 |
| `bullmq` | queue | 🔜 v0.2 |

---

## Zero overhead in production
```ts
init({ enabled: process.env.NODE_ENV !== 'production' });
```

When `enabled: false`, every internal function becomes a no-op immediately. There is no timer, no event, no allocation. The overhead is a single boolean check.

---

## API

### `init(config?): NodeyeInstance`
Initializes nodeye. Call once at the top of your entry file.

### `getInstance(): NodeyeInstance`
Returns the active instance anywhere in your app.

### `wrap(label, fn): Promise<T>`
Manually time any async or sync function.

### `subscribe(fn): () => void`
Subscribe directly to perf events. Returns an unsubscribe function.

### `consoleReporter(event): void`
Built-in colored console reporter (default).

### `jsonReporter(event): void`
Built-in newline-delimited JSON reporter.

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.