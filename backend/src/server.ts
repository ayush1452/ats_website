import { buildApp } from "./app.js";
import { createOpenAiProvider } from "./ai/index.js";
import { createRuntimeDependencies } from "./config/dependencies.js";
import { readEnvironment } from "./config/env.js";

try {
  process.loadEnvFile(".env");
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}

const env = readEnvironment();
const aiProvider = env.OPENAI_API_KEY === undefined
  ? undefined
  : createOpenAiProvider({
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
      timeoutMs: env.OPENAI_TIMEOUT_MS
    });

const runtime = createRuntimeDependencies(env);
const app = await buildApp({
  env,
  scanStore: runtime.scanStore,
  userStore: runtime.userStore,
  resumeStore: runtime.resumeStore,
  coverLetterStore: runtime.coverLetterStore,
  jobStore: runtime.jobStore,
  jobQueue: runtime.jobQueue,
  readinessChecks: runtime.readinessChecks,
  ...(aiProvider === undefined ? {} : { aiProvider })
});

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  app.log.info({ signal }, "shutting down");
  await app.close();
  await runtime.dispose();
  process.exitCode = 0;
};

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await app.listen({ host: env.HOST, port: env.PORT });
} catch (error) {
  app.log.error({ err: error }, "server failed to start");
  await runtime.dispose();
  process.exitCode = 1;
}
