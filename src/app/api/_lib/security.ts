import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { ResumeFileError } from "@/lib/extractors";

const memoryLimits = new Map<string, { count: number; resetAt: number }>();

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const requestHost =
    request.headers.get("host") ?? forwardedHost ?? requestUrl.host;
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const requestProtocol = forwardedProtocol
    ? `${forwardedProtocol.replace(/:$/u, "")}:`
    : requestUrl.protocol;

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    throw new ApiError("This request was rejected.", 403, "INVALID_ORIGIN");
  }

  const matchesPublicRequest =
    originUrl.host === requestHost && originUrl.protocol === requestProtocol;
  if (originUrl.origin !== requestUrl.origin && !matchesPublicRequest) {
    throw new ApiError("This request was rejected.", 403, "INVALID_ORIGIN");
  }
}

export function requestFingerprintHash(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address =
    forwarded ??
    request.headers.get("x-real-ip") ??
    request.headers.get("user-agent") ??
    "unknown";
  const salt =
    process.env.RATE_LIMIT_HASH_SALT ??
    process.env.SUPABASE_JWT_SECRET ??
    "resumepilot-local-demo";
  return createHash("sha256").update(`${salt}:${address}`).digest("hex");
}

export function checkMemoryRateLimit(
  request: Request,
  input: { namespace: string; limit: number; windowMs: number },
): void {
  const key = `${input.namespace}:${requestFingerprintHash(request)}`;
  const now = Date.now();
  const current = memoryLimits.get(key);
  if (!current || current.resetAt <= now) {
    memoryLimits.set(key, { count: 1, resetAt: now + input.windowMs });
    return;
  }
  if (current.count >= input.limit) {
    throw new ApiError(
      "Too many requests. Please wait and try again.",
      429,
      "RATE_LIMITED",
    );
  }
  current.count += 1;

  if (memoryLimits.size > 5_000) {
    for (const [storedKey, entry] of memoryLimits) {
      if (entry.resetAt <= now) memoryLimits.delete(storedKey);
    }
  }
}

export async function verifyCaptchaIfConfigured(
  request: Request,
  token: string | null,
): Promise<void> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return;
  if (!token) throw new ApiError("Please complete the verification.", 400, "CAPTCHA_REQUIRED");

  const form = new URLSearchParams({ secret, response: token });
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    },
  );
  const payload = (await response.json()) as { success?: boolean };
  if (!payload.success) {
    throw new ApiError(
      "Verification failed. Please try again.",
      400,
      "CAPTCHA_FAILED",
    );
  }
}

export function safeError(error: unknown): {
  status: number;
  code: string;
  message: string;
} {
  if (error instanceof ApiError) {
    return { status: error.status, code: error.code, message: error.message };
  }
  if (error instanceof ResumeFileError) {
    return { status: 400, code: error.code, message: error.message };
  }
  if (error instanceof ZodError) {
    return {
      status: 400,
      code: "INVALID_INPUT",
      message: error.issues[0]?.message ?? "Review the submitted fields.",
    };
  }
  return {
    status: 500,
    code: "INTERNAL_ERROR",
    message: "Something went wrong. Please try again.",
  };
}

export function errorResponse(error: unknown): NextResponse {
  const safe = safeError(error);
  return NextResponse.json(
    { error: safe.message, code: safe.code },
    { status: safe.status },
  );
}

export function secureTokenEquals(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return (
    leftBytes.length === rightBytes.length &&
    timingSafeEqual(leftBytes, rightBytes)
  );
}

export function requestFromNext(request: NextRequest): Request {
  return request;
}
