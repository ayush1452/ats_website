import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";
import { MAX_FILE_BYTES } from "./config/constants.js";
import { readEnvironment, type Environment } from "./config/env.js";
import { analysesRoutes } from "./routes/analyses.js";
import { scansRoutes } from "./routes/scans.js";
import { systemRoutes, type ReadinessCheck } from "./routes/system.js";
import { InlineJobQueue } from "./queue/inline-queue.js";
import type { JobQueue } from "./queue/types.js";
import { InMemoryScanStore } from "./scans/memory-store.js";
import type { ScanStore } from "./scans/types.js";
import {
  createAnalysisService,
  type AnalysisService,
  type SemanticAiProvider
} from "./services/analysis.js";
import { createScanProcessor } from "./services/scan-processor.js";

export type AppDependencies = {
  env?: Environment;
  aiProvider?: SemanticAiProvider;
  analysisService?: AnalysisService;
  scanStore?: ScanStore;
  jobQueue?: JobQueue;
  /** Extra readiness probes (e.g. database, object storage) for /readyz. */
  readinessChecks?: ReadinessCheck[];
  createId?: () => string;
  now?: () => Date;
};

export async function buildApp(dependencies: AppDependencies = {}): Promise<FastifyInstance> {
  const env = dependencies.env ?? readEnvironment();
  const analysisService =
    dependencies.analysisService ?? createAnalysisService(dependencies.aiProvider);
  const scanStore = dependencies.scanStore ?? new InMemoryScanStore();
  const jobQueue = dependencies.jobQueue ?? new InlineJobQueue();
  await jobQueue.start(
    createScanProcessor({
      scanStore,
      analysisService,
      ...(dependencies.now === undefined ? {} : { now: dependencies.now })
    })
  );
  const readinessChecks: ReadinessCheck[] = [
    { name: "queue", check: () => jobQueue.healthCheck() },
    ...(dependencies.readinessChecks ?? [])
  ];
  const app = Fastify({
    trustProxy: env.TRUST_PROXY,
    bodyLimit: MAX_FILE_BYTES + 256 * 1024,
    logger:
      env.NODE_ENV === "test"
        ? false
        : {
            serializers: {
              req(request) {
                return { method: request.method, url: request.url };
              }
            },
            redact: {
              paths: [
                "req.headers.authorization",
                "req.headers.cookie",
                "req.body",
                "body",
                "resumeText",
                "jobDescription"
              ],
              censor: "[Redacted]"
            }
          }
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
    // This service is intentionally called from a separately hosted frontend.
    // CORS and the mutation-origin guard enforce the configured caller; a
    // same-site CORP header would incorrectly block valid localhost and
    // split-domain deployments before CORS can authorize them.
    crossOriginResourcePolicy: { policy: "cross-origin" }
  });
  await app.register(cors, {
    origin: env.FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Accept", "Idempotency-Key"],
    maxAge: 600
  });
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
    errorResponseBuilder: (_request, context) => ({
      type: "https://hirelight.app/problems/rate-limited",
      title: "Too many requests",
      status: 429,
      code: "RATE_LIMITED",
      detail: `Try again in ${context.after}.`,
      retryable: true
    })
  });
  await app.register(multipart, {
    attachFieldsToBody: false,
    limits: {
      files: 1,
      fields: 6,
      parts: 7,
      fileSize: MAX_FILE_BYTES,
      fieldSize: 64 * 1024
    }
  });

  await app.register(systemRoutes, { analysisService, readinessChecks });
  await app.register(analysesRoutes, {
    allowedOrigin: env.FRONTEND_ORIGIN,
    analysisService,
    ...(dependencies.createId === undefined ? {} : { createId: dependencies.createId }),
    ...(dependencies.now === undefined ? {} : { now: dependencies.now })
  });
  await app.register(scansRoutes, {
    allowedOrigin: env.FRONTEND_ORIGIN,
    analysisService,
    scanStore,
    jobQueue,
    ...(dependencies.createId === undefined ? {} : { createId: dependencies.createId }),
    ...(dependencies.now === undefined ? {} : { now: dependencies.now })
  });

  // Stop consuming jobs when the server closes. The queue owns only its worker;
  // shared resources (Prisma, storage) are closed by whoever created them.
  app.addHook("onClose", async () => {
    await jobQueue.stop();
  });

  return app;
}
