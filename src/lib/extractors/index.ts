import type { CanonicalResumeDocument } from "@/types/domain";

import { extractDocxResume } from "./docx";
import { extractPdfResume } from "./pdf";
import { extractTextResume } from "./text";
import {
  validateFileMetadata,
  validateMagicBytes,
  withExtractionTimeout,
} from "./validation";

export interface ResumeExtractor {
  extract(file: File): Promise<CanonicalResumeDocument>;
}

export async function extractResumeFile(file: File): Promise<CanonicalResumeDocument> {
  const { filename, extension } = validateFileMetadata(file);
  const bytes = new Uint8Array(await file.arrayBuffer());
  validateMagicBytes(bytes, extension);

  switch (extension) {
    case ".pdf":
      return withExtractionTimeout(extractPdfResume(bytes, filename));
    case ".docx":
      return withExtractionTimeout(extractDocxResume(bytes, filename));
    case ".txt":
      return withExtractionTimeout(extractTextResume(bytes, filename));
  }
}

export class SafeResumeExtractor implements ResumeExtractor {
  extract(file: File): Promise<CanonicalResumeDocument> {
    return extractResumeFile(file);
  }
}

export { extractDocxResume, inspectDocxArchive } from "./docx";
export { extractPdfResume } from "./pdf";
export { extractTextResume } from "./text";
export {
  ResumeFileError,
  expectedMimeType,
  fileExtension,
  sanitizeFilename,
  validateFileMetadata,
  validateMagicBytes,
  withExtractionTimeout,
} from "./validation";
