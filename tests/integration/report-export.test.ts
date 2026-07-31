// @vitest-environment node

import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/reports/export/route";
import { DEMO_SCAN_ID, demoResult } from "@/data/demo";

describe("report PDF export", () => {
  it("paginates the complete selectable-text demo report", async () => {
    const response = await POST(
      new Request("http://localhost:3000/api/reports/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          scanId: DEMO_SCAN_ID,
          result: demoResult,
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/pdf");
    const bytes = new Uint8Array(await response.arrayBuffer());
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const task = pdfjs.getDocument({
      data: bytes,
      useWasm: false,
      verbosity: 0,
    });
    const pdf = await task.promise;
    expect(pdf.numPages).toBeGreaterThan(1);

    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(
        content.items
          .flatMap((item) => ("str" in item ? [item.str] : []))
          .join(" "),
      );
    }
    const text = pages.join(" ");
    expect(text).toContain("Score dimensions");
    expect(text).toContain("Rewrite recommendations");
    expect(text).toContain("Benchmark context");
    expect(text).toContain("cannot guarantee ATS acceptance");
    await task.destroy();
  });
});
