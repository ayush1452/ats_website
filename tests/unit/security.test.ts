import { describe, expect, it } from "vitest";

import { ApiError, assertSameOrigin } from "@/app/api/_lib/security";

describe("same-origin request validation", () => {
  it("accepts the public Host header when the framework uses an internal URL", () => {
    const request = new Request("http://localhost:3002/api/scans", {
      headers: {
        Host: "127.0.0.1:3002",
        Origin: "http://127.0.0.1:3002",
      },
    });

    expect(() => assertSameOrigin(request)).not.toThrow();
  });

  it("accepts a trusted forwarded host and protocol", () => {
    const request = new Request("http://internal:3000/api/scans", {
      headers: {
        Origin: "https://resume.example.com",
        "X-Forwarded-Host": "resume.example.com",
        "X-Forwarded-Proto": "https",
      },
    });

    expect(() => assertSameOrigin(request)).not.toThrow();
  });

  it("rejects a different browser origin", () => {
    const request = new Request("https://resume.example.com/api/scans", {
      headers: {
        Host: "resume.example.com",
        Origin: "https://attacker.example",
      },
    });

    expect(() => assertSameOrigin(request)).toThrowError(ApiError);
  });
});
