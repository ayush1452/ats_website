// Optional, fully-local text embeddings. When enabled, an ONNX sentence model
// runs in-process via Transformers.js (onnxruntime) — no API key, no network at
// inference, and résumé/JD text never leaves the server. This layer only enriches
// the *displayed* keyword recall; it never feeds the deterministic algorithm score
// (that is computed upstream, before any embeddings run).

export type Embedder = {
  /** Returns one L2-normalized vector per input string, order-preserving. */
  embed(texts: string[]): Promise<number[][]>;
};

export type LocalEmbedderOptions = {
  enabled: boolean;
  model?: string;
};

const DEFAULT_MODEL = "Xenova/bge-small-en-v1.5";

/** Cosine similarity of two equal-length vectors. Safe on zero vectors. */
export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < length; index += 1) {
    const left = a[index] ?? 0;
    const right = b[index] ?? 0;
    dot += left * right;
    normA += left * left;
    normB += right * right;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Builds a local embedder, or returns `null` when embeddings are disabled — so
 * callers can treat "no embedder" as the always-valid default path. The heavy
 * model is loaded lazily on first use and cached for the process lifetime.
 */
export function createLocalEmbedder(options: LocalEmbedderOptions): Embedder | null {
  if (!options.enabled) return null;
  const modelId = options.model ?? DEFAULT_MODEL;

  // Lazily import Transformers.js so the dependency is never loaded (nor its
  // native runtime initialized) unless embeddings are actually switched on.
  let extractorPromise: Promise<(input: string[], opts: unknown) => Promise<unknown>> | null = null;
  const getExtractor = async () => {
    extractorPromise ??= import("@xenova/transformers").then(async (mod) => {
      // Allow the model to be fetched/cached; production images bake it in.
      mod.env.allowLocalModels = true;
      return (await mod.pipeline("feature-extraction", modelId, {
        quantized: true
      })) as unknown as (input: string[], opts: unknown) => Promise<unknown>;
    });
    return extractorPromise;
  };

  return {
    async embed(texts: string[]): Promise<number[][]> {
      if (texts.length === 0) return [];
      const extractor = await getExtractor();
      const output = (await extractor(texts, { pooling: "mean", normalize: true })) as {
        tolist(): number[][];
      };
      return output.tolist();
    }
  };
}
