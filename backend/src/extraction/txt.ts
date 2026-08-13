import { MAX_RESUME_CHARACTERS } from "../config/constants.js";
import { ExtractionError } from "./errors.js";
import {
  assertEnoughText,
  buildCanonicalDocument,
  countWords
} from "./normalization.js";
import type { ExtractedResume, LayoutSignals, ValidatedUpload } from "./types.js";

const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });
const EMPTY_LAYOUT: LayoutSignals = {
  tableCount: 0,
  textBoxCount: 0,
  columnCount: 1,
  explicitPageBreaks: 0,
  hasHeadersOrFooters: false,
  readingOrderRisk: false
};

function containsUnsafeControl(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0);
    if (
      code !== undefined &&
      (code === 0 ||
        (code >= 1 && code <= 8) ||
        code === 11 ||
        code === 12 ||
        (code >= 14 && code <= 31))
    ) {
      return true;
    }
  }
  return false;
}

export function extractTxt(
  upload: ValidatedUpload,
  checkpoint: () => void = () => undefined
): ExtractedResume {
  checkpoint();
  let decoded: string;
  try {
    decoded = UTF8_DECODER.decode(upload.data);
  } catch (error) {
    throw new ExtractionError("MALFORMED_FILE", { cause: error });
  }

  if (containsUnsafeControl(decoded)) {
    throw new ExtractionError("MALFORMED_FILE");
  }
  checkpoint();

  const normalized = decoded
    .replace(/^\uFEFF/u, "")
    .replace(/\r\n?/gu, "\n")
    .normalize("NFKC");

  if (normalized.length > MAX_RESUME_CHARACTERS) {
    throw new ExtractionError("CONTENT_LIMIT_EXCEEDED");
  }
  checkpoint();

  const document = buildCanonicalDocument(
    normalized.split("\n").map((line) => ({ page: 1, text: line })),
    EMPTY_LAYOUT
  );
  checkpoint();
  assertEnoughText(document);
  const wordCount = countWords(document.text);

  return {
    fileName: upload.fileName,
    fileType: "txt",
    text: document.text,
    wordCount,
    pageCount: 1,
    document,
    layoutSignals: EMPTY_LAYOUT,
    warnings: wordCount < 100 ? ["LOW_TEXT_DENSITY"] : []
  };
}
