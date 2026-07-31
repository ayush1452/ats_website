import JSZip from "jszip";
import { zodTextFormat } from "openai/helpers/zod";
import { describe, expect, it } from "vitest";

import {
  DEMO_SCAN_ID,
  demoDocument,
  demoResult,
  demoScans,
  demoVersions,
} from "@/data/demo";
import {
  analysisResultSchema,
  semanticEnrichmentSchema,
} from "@/lib/analysis";
import { recommendationSchema } from "@/lib/analysis/schemas";
import {
  ResumeFileError,
  inspectDocxArchive,
  sanitizeFilename,
  validateFileMetadata,
  validateMagicBytes,
} from "@/lib/extractors";
import { DemoRepository } from "@/lib/repositories";

describe("upload validation", () => {
  it("removes path traversal and unsafe filename characters", () => {
    const filename = sanitizeFilename("../../Résumé<script>.pdf");
    expect(filename).not.toContain("/");
    expect(filename).not.toContain("<");
    expect(filename).toMatch(/\.pdf$/u);
  });

  it("rejects oversized and mismatched files", () => {
    expect(() =>
      validateFileMetadata({
        name: "resume.pdf",
        size: 8 * 1024 * 1024 + 1,
        type: "application/pdf",
      }),
    ).toThrowError(ResumeFileError);
    expect(() =>
      validateFileMetadata({
        name: "resume.pdf",
        size: 100,
        type: "text/plain",
      }),
    ).toThrowError(/do not match/u);
  });

  it("checks magic bytes and binary text", () => {
    expect(() =>
      validateMagicBytes(new TextEncoder().encode("not a pdf"), ".pdf"),
    ).toThrowError(/do not match/u);
    expect(() =>
      validateMagicBytes(new Uint8Array([65, 0, 66]), ".txt"),
    ).toThrowError(/binary/u);
  });

  it("rejects macro or embedded DOCX content", async () => {
    const zip = new JSZip();
    zip.file(
      "[Content_Types].xml",
      '<Types><Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    );
    zip.file("word/document.xml", "<w:document><w:body /></w:document>");
    zip.file("word/vbaProject.bin", new Uint8Array([1, 2, 3]));
    const bytes = await zip.generateAsync({ type: "uint8array" });
    await expect(inspectDocxArchive(bytes)).rejects.toMatchObject({
      code: "UNSAFE_ARCHIVE",
    });
  });

  it("accepts a minimal DOCX after central-directory preflight", async () => {
    const zip = new JSZip();
    zip.file(
      "[Content_Types].xml",
      '<Types><Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    );
    zip.file(
      "word/document.xml",
      "<w:document><w:body><w:p>Resume text</w:p></w:body></w:document>",
    );
    zip.file("word/header1.xml", "<w:hdr />");
    const bytes = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
    });

    await expect(inspectDocxArchive(bytes)).resolves.toEqual({
      hasTable: false,
      hasHeader: true,
      hasFooter: false,
    });
  });

  it("rejects a high-expansion DOCX before inflating its entries", async () => {
    const zip = new JSZip();
    zip.file(
      "[Content_Types].xml",
      '<Types><Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    );
    zip.file(
      "word/document.xml",
      `<w:document><w:body>${"A".repeat(2_000_000)}</w:body></w:document>`,
    );
    const bytes = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });

    await expect(inspectDocxArchive(bytes)).rejects.toMatchObject({
      code: "UNSAFE_ARCHIVE",
    });
  });
});

describe("Alex Morgan demo fixture", () => {
  it("is schema-valid and preserves every headline score", () => {
    expect(analysisResultSchema.safeParse(demoResult).success).toBe(true);
    expect(demoResult.overallScore).toBe(73);
    expect(demoResult.componentScores).toEqual({
      atsParse: 87,
      recruiterClarity: 72,
      roleMatch: 73,
    });
    expect(demoResult.metrics).toMatchObject({
      keywordMatch: 78,
      impact: 62,
      readability: 81,
    });
  });

  it("contains the exact requested keyword groups and stable source offsets", () => {
    const matched = demoResult.keywords
      .filter((item) => item.status === "matched")
      .map((item) => item.keyword);
    const partial = demoResult.keywords
      .filter((item) => item.status === "partial")
      .map((item) => item.keyword);
    const missing = demoResult.keywords
      .filter((item) => item.status === "missing")
      .map((item) => item.keyword);

    expect(matched).toContain("Product Roadmap");
    expect(matched).toContain("Mixpanel");
    expect(partial).toEqual(["Python", "SQL"]);
    expect(missing).toEqual([
      "Tableau",
      "GTM Strategy",
      "Revenue KPIs",
      "Competitive Analysis",
    ]);
    for (const annotation of demoResult.annotations) {
      const finding = demoResult.findings.find(
        (candidate) => candidate.id === annotation.findingId,
      );
      expect(
        demoDocument.normalizedText.slice(annotation.start, annotation.end),
      ).toBe(finding?.sourceText);
    }
  });

  it("exports the stable scan id and two ordered immutable versions", () => {
    expect(DEMO_SCAN_ID).toBe("alex-morgan-product-lead");
    expect(demoScans[0]?.id).toBe(DEMO_SCAN_ID);
    expect(demoVersions.map((version) => version.version)).toEqual([1, 2]);
    expect(demoVersions.map((version) => version.score)).toEqual([61, 73]);
  });

  it("rejects unknown keys in provider-style result payloads", () => {
    expect(
      analysisResultSchema.safeParse({ ...demoResult, untrusted: true }).success,
    ).toBe(false);
  });

  it("compiles provider schemas to OpenAI strict structured-output formats", () => {
    expect(() =>
      zodTextFormat(semanticEnrichmentSchema, "semantic_enrichment"),
    ).not.toThrow();
    expect(() =>
      zodTextFormat(recommendationSchema, "resume_recommendation"),
    ).not.toThrow();
  });

  it("uses an SSR-safe memory repository when IndexedDB is unavailable", async () => {
    const repository = new DemoRepository();
    expect((await repository.listScans())[0]?.id).toBe(DEMO_SCAN_ID);
    expect((await repository.getScan(DEMO_SCAN_ID))?.overallScore).toBe(73);
    expect(await repository.listVersions("alex-morgan-resume")).toHaveLength(2);
  });
});
