import { analyzerConfig } from "@/config/scoring";

export class ResumeFileError extends Error {
  constructor(
    message: string,
    readonly code:
      | "EMPTY_FILE"
      | "FILE_TOO_LARGE"
      | "INVALID_FILENAME"
      | "UNSUPPORTED_EXTENSION"
      | "UNSUPPORTED_MIME"
      | "MIME_MISMATCH"
      | "ENCRYPTED_FILE"
      | "MALFORMED_FILE"
      | "UNSAFE_ARCHIVE"
      | "EXTRACTION_TIMEOUT",
  ) {
    super(message);
    this.name = "ResumeFileError";
  }
}

export function fileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  return lastDot >= 0 ? filename.slice(lastDot).toLocaleLowerCase() : "";
}

export function sanitizeFilename(filename: string): string {
  const basename = filename
    .normalize("NFKC")
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    ?.replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/^\.+/, "")
    .replace(/[^a-zA-Z0-9._ ()+\-]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/-{2,}/g, "-")
    .trim();

  if (!basename || basename === "." || basename === "..") {
    throw new ResumeFileError("The file name is invalid.", "INVALID_FILENAME");
  }

  const extension = fileExtension(basename);
  const stem = basename.slice(0, Math.max(0, basename.length - extension.length)).slice(0, 180);
  if (!stem) {
    throw new ResumeFileError("The file name is invalid.", "INVALID_FILENAME");
  }
  return `${stem}${extension}`.slice(0, 220);
}

export function expectedMimeType(extension: string): string | null {
  switch (extension) {
    case ".pdf":
      return "application/pdf";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".txt":
      return "text/plain";
    default:
      return null;
  }
}

export function validateFileMetadata(file: {
  name: string;
  size: number;
  type: string;
}): { filename: string; extension: ".pdf" | ".docx" | ".txt" } {
  if (file.size <= 0) {
    throw new ResumeFileError("The selected file is empty.", "EMPTY_FILE");
  }
  if (file.size > analyzerConfig.maxFileBytes) {
    throw new ResumeFileError(
      "The selected file exceeds the 8 MiB limit.",
      "FILE_TOO_LARGE",
    );
  }

  const filename = sanitizeFilename(file.name);
  const extension = fileExtension(filename);
  if (!analyzerConfig.acceptedExtensions.includes(extension as ".pdf" | ".docx" | ".txt")) {
    throw new ResumeFileError(
      "Upload a PDF, DOCX, or TXT resume.",
      "UNSUPPORTED_EXTENSION",
    );
  }

  const expected = expectedMimeType(extension);
  if (!expected || !analyzerConfig.acceptedMimeTypes.includes(file.type as never)) {
    throw new ResumeFileError(
      "The browser-reported file type is not supported.",
      "UNSUPPORTED_MIME",
    );
  }
  if (file.type !== expected) {
    throw new ResumeFileError(
      "The file extension and browser-reported type do not match.",
      "MIME_MISMATCH",
    );
  }

  return { filename, extension: extension as ".pdf" | ".docx" | ".txt" };
}

export function validateMagicBytes(
  bytes: Uint8Array,
  extension: ".pdf" | ".docx" | ".txt",
): void {
  if (extension === ".pdf") {
    const signature = new TextDecoder("ascii").decode(bytes.slice(0, 5));
    if (signature !== "%PDF-") {
      throw new ResumeFileError(
        "The file contents do not match a PDF document.",
        "MIME_MISMATCH",
      );
    }
    return;
  }

  if (extension === ".docx") {
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
      throw new ResumeFileError(
        "The file contents do not match a DOCX archive.",
        "MIME_MISMATCH",
      );
    }
    return;
  }

  if (bytes.slice(0, Math.min(bytes.length, 4_096)).includes(0)) {
    throw new ResumeFileError(
      "The text file contains binary data.",
      "MIME_MISMATCH",
    );
  }
}

export async function withExtractionTimeout<T>(
  operation: Promise<T>,
  timeoutMs = 12_000,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(
        new ResumeFileError(
          "Resume extraction took too long. Try a simpler document.",
          "EXTRACTION_TIMEOUT",
        ),
      );
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation, deadline]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
