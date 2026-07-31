import type { CanonicalResumeDocument } from "@/types/domain";

import { detectSections, normalizeWhitespace } from "@/lib/analysis/text";
import { ResumeFileError } from "./validation";

export async function extractTextResume(
  bytes: Uint8Array,
  filename: string,
): Promise<CanonicalResumeDocument> {
  let decoded: string;
  try {
    decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ResumeFileError(
      "The TXT resume must use UTF-8 encoding.",
      "MALFORMED_FILE",
    );
  }

  const normalizedText = normalizeWhitespace(decoded);
  if (!normalizedText) {
    throw new ResumeFileError(
      "No readable text was found in this file.",
      "MALFORMED_FILE",
    );
  }

  return {
    version: 1,
    filename,
    fileType: "txt",
    pageCount: 1,
    normalizedText,
    spans: [
      {
        id: "txt-span-1",
        page: 1,
        text: normalizedText,
        start: 0,
        end: normalizedText.length,
      },
    ],
    sections: detectSections(normalizedText),
    layoutSignals: [],
    extractionConfidence: 0.99,
  };
}
