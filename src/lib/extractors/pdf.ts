import { detectSections, normalizeWhitespace } from "@/lib/analysis/text";
import type {
  CanonicalResumeDocument,
  LayoutSignal,
  TextSpan,
} from "@/types/domain";

import { ResumeFileError } from "./validation";

const MAX_PDF_PAGES = 100;

export async function extractPdfResume(
  bytes: Uint8Array,
  filename: string,
): Promise<CanonicalResumeDocument> {
  const preview = new TextDecoder("latin1").decode(bytes.slice(0, Math.min(bytes.length, 100_000)));
  if (/\/Encrypt\b/u.test(preview)) {
    throw new ResumeFileError(
      "Password-protected PDFs cannot be analyzed.",
      "ENCRYPTED_FILE",
    );
  }

  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const loadingTask = pdfjs.getDocument({
      data: bytes.slice(),
      useSystemFonts: true,
      useWasm: false,
      stopAtErrors: false,
      verbosity: 0,
    });
    const pdf = await loadingTask.promise;
    if (pdf.numPages > MAX_PDF_PAGES) {
      await loadingTask.destroy();
      throw new ResumeFileError(
        `PDF resumes are limited to ${MAX_PDF_PAGES} pages.`,
        "MALFORMED_FILE",
      );
    }

    const spans: TextSpan[] = [];
    const pageTexts: string[] = [];
    const layoutSignals: LayoutSignal[] = [];
    let documentOffset = 0;

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent({
        includeMarkedContent: false,
        disableNormalization: false,
      });
      const pageParts: string[] = [];
      const xPositions: number[] = [];

      for (const item of content.items) {
        if (!("str" in item) || !item.str.trim()) continue;
        const text = item.str.replace(/\u0000/gu, "").trim();
        if (!text) continue;
        if (pageParts.length > 0) pageParts.push(" ");
        const start = documentOffset + pageParts.join("").length;
        pageParts.push(text);
        const end = documentOffset + pageParts.join("").length;
        const x = Number(item.transform?.[4] ?? 0);
        const y = Number(item.transform?.[5] ?? 0);
        xPositions.push(x);
        spans.push({
          id: `pdf-${pageNumber}-${spans.length + 1}`,
          page: pageNumber,
          text,
          start,
          end,
          x,
          y,
          width: Number(item.width ?? 0),
          height: Number(item.height ?? 0),
        });
      }

      const pageText = normalizeWhitespace(pageParts.join(""));
      pageTexts.push(pageText);
      documentOffset += pageText.length + 2;

      const distinctLeftEdges = [...new Set(xPositions.map((x) => Math.round(x / 18) * 18))];
      if (distinctLeftEdges.length >= 5) {
        layoutSignals.push({
          type: "column",
          page: pageNumber,
          confidence: 0.58,
          detail:
            "Several distinct text starting positions suggest a possible multi-column or highly aligned layout.",
        });
      }
      try {
        page.cleanup();
      } catch {
        // Text extraction has already completed; cleanup must not invalidate it.
      }
    }

    try {
      await loadingTask.destroy();
    } catch {
      // Worker disposal is best-effort after a complete extraction.
    }
    const normalizedText = normalizeWhitespace(pageTexts.join("\n\n"));
    if (!normalizedText) {
      throw new ResumeFileError(
        "No readable text was found. Image-only PDFs require OCR, which is not available in v1.",
        "MALFORMED_FILE",
      );
    }

    // Re-anchor spans to the normalized text so annotations always use stable offsets.
    let searchFrom = 0;
    const anchoredSpans = spans.flatMap((span) => {
      const start = normalizedText.indexOf(span.text, searchFrom);
      if (start < 0) return [];
      searchFrom = start + span.text.length;
      return [{ ...span, start, end: start + span.text.length }];
    });

    return {
      version: 1,
      filename,
      fileType: "pdf",
      pageCount: pdf.numPages,
      normalizedText,
      spans: anchoredSpans,
      sections: detectSections(normalizedText),
      layoutSignals,
      extractionConfidence: anchoredSpans.length > 0 ? 0.9 : 0.65,
    };
  } catch (error) {
    if (error instanceof ResumeFileError) throw error;
    const name =
      typeof error === "object" && error !== null && "name" in error
        ? String(error.name)
        : "";
    if (name === "PasswordException") {
      throw new ResumeFileError(
        "Password-protected PDFs cannot be analyzed.",
        "ENCRYPTED_FILE",
      );
    }
    throw new ResumeFileError(
      "The PDF is malformed or its text could not be extracted.",
      "MALFORMED_FILE",
    );
  }
}
