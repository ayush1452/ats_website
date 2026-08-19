import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";
import { MAX_FILE_BYTES } from "./config/constants.js";
import { readEnvironment, type Environment } from "./config/env.js";
import { accountRoutes } from "./routes/account.js";
import { aiRoutes } from "./routes/ai.js";
import { analysesRoutes } from "./routes/analyses.js";
import { authRoutes } from "./routes/auth.js";
import { coverLettersRoutes } from "./routes/cover-letters.js";
import { jobsRoutes } from "./routes/jobs.js";
import { resumesRoutes } from "./routes/resumes.js";
import { scansRoutes } from "./routes/scans.js";
import { templatesRoutes } from "./routes/templates.js";
import { systemRoutes, type ReadinessCheck } from "./routes/system.js";
import { InMemoryUserStore } from "./auth/memory-user-store.js";
import type { UserStore } from "./auth/types.js";
import { InMemoryResumeStore } from "./resumes/memory-store.js";
import type { ResumeStore } from "./resumes/types.js";
import { InMemoryCoverLetterStore } from "./cover-letters/memory-store.js";
import type { CoverLetterStore } from "./cover-letters/types.js";
import { InMemoryJobStore } from "./jobs/memory-store.js";
import type { JobStore } from "./jobs/types.js";
import { createMailer, type Mailer } from "./services/mailer.js";
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
import { createLocalEmbedder, type Embedder } from "./ai/embeddings.js";
import {
  createDisabledAiContentProvider,
  createOpenAiContentProvider,
  type AiContentProvider
} from "./ai/content-provider.js";

export type AppDependencies = {
  env?: Environment;
  aiProvider?: SemanticAiProvider;
  aiContentProvider?: AiContentProvider;
  embedder?: Embedder;
  analysisService?: AnalysisService;
  scanStore?: ScanStore;
  userStore?: UserStore;
  resumeStore?: ResumeStore;
  coverLetterStore?: CoverLetterStore;
  jobStore?: JobStore;
  mailer?: Mailer;
  jobQueue?: JobQueue;
  /** Extra readiness probes (e.g. database, object storage) for /readyz. */
  readinessChecks?: ReadinessCheck[];
  createId?: () => string;
  now?: () => Date;
};

export async function buildApp(dependencies: AppDependencies = {}): Promise<FastifyInstance> {
  const env = dependencies.env ?? readEnvironment();
  const embedder =
    dependencies.embedder ??
    createLocalEmbedder({
      enabled: env.EMBEDDINGS_ENABLED,
      model: env.EMBEDDINGS_MODEL
    }) ??
    undefined;
  const analysisService =
    dependencies.analysisService ??
    createAnalysisService(dependencies.aiProvider, embedder);
  const scanStore = dependencies.scanStore ?? new InMemoryScanStore();
  const userStore = dependencies.userStore ?? new InMemoryUserStore();
  const resumeStore = dependencies.resumeStore ?? new InMemoryResumeStore();
  const coverLetterStore = dependencies.coverLetterStore ?? new InMemoryCoverLetterStore();
  const jobStore = dependencies.jobStore ?? new InMemoryJobStore();
  const mailer =
    dependencies.mailer ??
    createMailer({
      transport: env.EMAIL_TRANSPORT,
      from: env.EMAIL_FROM,
      ...(env.RESEND_API_KEY ? { resendApiKey: env.RESEND_API_KEY } : {}),
    });
  const aiContentProvider =
    dependencies.aiContentProvider ??
    (env.OPENAI_API_KEY
      ? createOpenAiContentProvider({
          apiKey: env.OPENAI_API_KEY,
          model: env.OPENAI_MODEL,
          timeoutMs: env.OPENAI_TIMEOUT_MS,
        })
      : createDisabledAiContentProvider());
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
  await app.register(cookie);
  await app.register(cors, {
    origin: env.FRONTEND_ORIGIN,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    // `credentials` lets the browser send the httpOnly session cookie to the API.
    credentials: true,
    // `x-scan-token` authorizes stored-scan reads/deletes; without it in the
    // allow-list the browser blocks the actual request after a passing preflight.
    allowedHeaders: ["Content-Type", "Accept", "Idempotency-Key", "x-scan-token"],
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
  const authContext = {
    userStore,
    sessionSecret: env.AUTH_SECRET,
    secureCookies: env.NODE_ENV === "production",
  };
  await app.register(authRoutes, {
    userStore,
    mailer,
    sessionSecret: env.AUTH_SECRET,
    secureCookies: env.NODE_ENV === "production",
    allowedOrigin: env.FRONTEND_ORIGIN,
  });
  await app.register(resumesRoutes, {
    resumeStore,
    scanStore,
    authContext,
    allowedOrigin: env.FRONTEND_ORIGIN,
  });
  await app.register(templatesRoutes);
  await app.register(coverLettersRoutes, {
    coverLetterStore,
    authContext,
    allowedOrigin: env.FRONTEND_ORIGIN,
  });
  await app.register(jobsRoutes, {
    jobStore,
    authContext,
    allowedOrigin: env.FRONTEND_ORIGIN,
  });
  await app.register(accountRoutes, {
    userStore,
    resumeStore,
    coverLetterStore,
    jobStore,
    scanStore,
    authContext,
    allowedOrigin: env.FRONTEND_ORIGIN,
    secureCookies: env.NODE_ENV === "production",
  });
  await app.register(aiRoutes, {
    aiProvider: aiContentProvider,
    resumeStore,
    authContext,
    allowedOrigin: env.FRONTEND_ORIGIN,
  });
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
    authContext,
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
