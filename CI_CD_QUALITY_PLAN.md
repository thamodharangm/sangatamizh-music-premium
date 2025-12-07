# CI/CD & Quality Assurance Plan

**Goal**: Automate code quality checks, testing, and deployment stability, while ensuring production observability.

## 1. GitHub Actions Workflow (`.github/workflows/quality.yml`)

This workflow runs on every Pull Request to ensure quality **before** merging.

```yaml
name: Quality & Test
on: [pull_request]

jobs:
  quality:
    name: Lint & Typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci

      # Frontend
      - name: Lint Client
        run: npm run lint --prefix client
      - name: Typecheck Client
        run: npx tsc --noEmit -p client/tsconfig.json

      # Backend
      - name: Lint Server
        run: npm run lint --prefix server
      - name: Typecheck Server
        run: npx tsc --noEmit -p server/tsconfig.json

  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
      - run: npm ci
      # Run Jest tests
      - run: npm test

  build-dry-run:
    name: Docker Build Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build API Image
        run: docker build ./server -t music-api:test
      - name: Build Client Image
        run: docker build ./client -t music-client:test
```

## 2. Integration Test Strategy

We need to test the critical path: **Upload -> Transcode -> Persistence**.

**Tools**: `supertest` (API), `testcontainers` (Postgres/Redis/Minio).

### Sample Test: `server/src/tests/integration/upload.test.ts`

```typescript
import request from "supertest";
import { app } from "../../app";
import { db } from "../../config/db";
import { redis } from "../../config/redis";
// Mock S3 and Queue to avoid external deps in integration phase
jest.mock("../../services/storage.service");
jest.mock("../../config/queue");

describe("Upload Pipeline Integration", () => {
  let token: string;

  beforeAll(async () => {
    // 1. Setup Test DB
    await db.$connect();
    // 2. Create User & Get Token
    const res = await request(app).post("/auth/register").send({
      email: "test@test.com",
      password: "Password123!",
    });
    token = res.body.accessToken;
  });

  afterAll(async () => {
    await db.user.deleteMany();
    await db.$disconnect();
  });

  it("should accept file upload and queue job", async () => {
    // 1. Upload File
    const res = await request(app)
      .post("/api/songs/upload")
      .set("Authorization", `Bearer ${token}`)
      .field("title", "Test Song")
      .field("artist", "Tester")
      .attach("file", Buffer.from("fake-audio-content"), "test.mp3");

    // 2. Assert Response
    expect(res.status).toBe(202);
    expect(res.body).toHaveProperty("jobId");

    // 3. Assert DB State (Pending)
    const song = await db.song.findFirst({ where: { title: "Test Song" } });
    expect(song).toBeTruthy();
    expect(song?.status).toBe("processing");
  });

  // Note: Full E2E with Worker requires a running Redis/Worker setup
  // usually handled in a separate E2E suite using Docker Compose.
});
```

## 3. Observability Stack

### Error Tracking: **Sentry**

- **Frontend**: Catch React Error Boundaries, unhandled promises, and network failures.
- **Backend**: Catch Express middleware errors, Worker failures, and DB errors.
- **Setup**:
  ```typescript
  // server/src/app.ts
  Sentry.init({ dsn: process.env.SENTRY_DSN });
  app.use(Sentry.Handlers.requestHandler());
  // ... routes ...
  app.use(Sentry.Handlers.errorHandler());
  ```

### Metrics: **Prometheus + Grafana**

- **Library**: `prom-client` in Node.js.
- **Metrics to expose (`/metrics`)**:
  1.  `http_request_duration_seconds`: API latency.
  2.  `job_queue_length`: BullMQ waiting count (Critical for scaler).
  3.  `transcode_duration_seconds`: Time taken by FFmpeg.
  4.  `active_users_gauge`: WebSocket connections.

## 4. Alerting Checklist

Define these alerts in Grafana or Google Cloud Monitoring.

| Severity     | Alert Condition                    | Reasoning                                 | Action                               |
| :----------- | :--------------------------------- | :---------------------------------------- | :----------------------------------- |
| **CRITICAL** | `http_error_rate > 5%` (5m window) | API is failing for multiple users.        | Check logs, rollback deployment.     |
| **CRITICAL** | `worker_failures > 5` (1m window)  | Transcoding is broken.                    | Check S3 permissions, FFmpeg errors. |
| **CRITICAL** | `db_cpu > 90%`                     | Database overload.                        | Check slow queries, scale instance.  |
| **WARNING**  | `queue_latency > 5m`               | Backlog growing faster than workers.      | Auto-scale worker instances.         |
| **WARNING**  | `disk_usage > 80%`                 | Server running out of space (temp files). | Prune temp files, increase volume.   |

## 5. Deployment Gates

- **No Deploy if**: Coverage < 70%.
- **No Deploy if**: Critical vulnerability found (`npm audit`).
- **Rollback if**: Health check `/health` fails after deployment.
