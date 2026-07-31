import JSZip from "jszip";
import mammoth from "mammoth";

import { detectSections, normalizeWhitespace } from "@/lib/analysis/text";
import type { CanonicalResumeDocument, LayoutSignal } from "@/types/domain";

import { ResumeFileError } from "./validation";

const MAX_ARCHIVE_ENTRIES = 1_000;
const MAX_EXPANDED_XML_BYTES = 16 * 1024 * 1024;
const MAX_ARCHIVE_EXPANDED_BYTES = 32 * 1024 * 1024;
const MAX_COMPRESSION_RATIO = 150;

interface CentralDirectoryEntry {
  name: string;
  compressedSize: number;
  uncompressedSize: number;
}

function unsafeArchivePath(name: string): boolean {
  const normalized = name.replace(/\\/g, "/");
  return (
    normalized.startsWith("/") ||
    /^[a-zA-Z]:\//.test(normalized) ||
    normalized.split("/").some((segment) => segment === "..")
  );
}

function findEndOfCentralDirectory(bytes: Uint8Array): number {
  const minimumOffset = Math.max(0, bytes.length - 65_557);
  const view = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  );
  for (let offset = bytes.length - 22; offset >= minimumOffset; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) return offset;
  }
  return -1;
}

function inspectCentralDirectory(bytes: Uint8Array): CentralDirectoryEntry[] {
  const eocdOffset = findEndOfCentralDirectory(bytes);
  if (eocdOffset < 0) {
    throw new ResumeFileError(
      "The DOCX archive does not contain a valid ZIP directory.",
      "MALFORMED_FILE",
    );
  }
  const view = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  );
  const diskNumber = view.getUint16(eocdOffset + 4, true);
  const centralDisk = view.getUint16(eocdOffset + 6, true);
  const entryCount = view.getUint16(eocdOffset + 10, true);
  const centralSize = view.getUint32(eocdOffset + 12, true);
  const centralOffset = view.getUint32(eocdOffset + 16, true);
  if (
    diskNumber !== 0 ||
    centralDisk !== 0 ||
    entryCount === 0xffff ||
    centralSize === 0xffffffff ||
    centralOffset === 0xffffffff ||
    entryCount > MAX_ARCHIVE_ENTRIES ||
    centralOffset + centralSize > eocdOffset
  ) {
    throw new ResumeFileError(
      "ZIP64, multi-disk, or oversized DOCX archives are not accepted.",
      "UNSAFE_ARCHIVE",
    );
  }

  const decoder = new TextDecoder("utf-8", { fatal: false });
  const entries: CentralDirectoryEntry[] = [];
  let offset = centralOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (
      offset + 46 > bytes.length ||
      view.getUint32(offset, true) !== 0x02014b50
    ) {
      throw new ResumeFileError(
        "The DOCX ZIP directory is malformed.",
        "MALFORMED_FILE",
      );
    }
    const flags = view.getUint16(offset + 8, true);
    const compressionMethod = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const filenameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const nextOffset =
      offset + 46 + filenameLength + extraLength + commentLength;
    if (
      nextOffset > bytes.length ||
      compressedSize === 0xffffffff ||
      uncompressedSize === 0xffffffff ||
      (flags & 0x1) !== 0 ||
      ![0, 8].includes(compressionMethod)
    ) {
      throw new ResumeFileError(
        "The DOCX archive uses an unsupported or encrypted ZIP entry.",
        "UNSAFE_ARCHIVE",
      );
    }
    const name = decoder.decode(
      bytes.subarray(offset + 46, offset + 46 + filenameLength),
    );
    if (
      unsafeArchivePath(name) ||
      /(?:vbaProject\.bin|macros|activeX|embeddings)/iu.test(name)
    ) {
      throw new ResumeFileError(
        "The DOCX archive contains an unsafe path or embedded content.",
        "UNSAFE_ARCHIVE",
      );
    }
    entries.push({ name, compressedSize, uncompressedSize });
    offset = nextOffset;
  }
  if (offset !== centralOffset + centralSize) {
    throw new ResumeFileError(
      "The DOCX ZIP directory size is inconsistent.",
      "MALFORMED_FILE",
    );
  }

  const totals = entries.reduce(
    (sum, entry) => ({
      compressed: sum.compressed + entry.compressedSize,
      expanded: sum.expanded + entry.uncompressedSize,
    }),
    { compressed: 0, expanded: 0 },
  );
  if (
    totals.expanded > MAX_ARCHIVE_EXPANDED_BYTES ||
    (totals.compressed > 0 &&
      totals.expanded / totals.compressed > MAX_COMPRESSION_RATIO)
  ) {
    throw new ResumeFileError(
      "The DOCX archive expands beyond the safe processing limit.",
      "UNSAFE_ARCHIVE",
    );
  }
  return entries;
}

export async function inspectDocxArchive(bytes: Uint8Array): Promise<{
  hasTable: boolean;
  hasHeader: boolean;
  hasFooter: boolean;
}> {
  const centralEntries = inspectCentralDirectory(bytes);
  let archive: JSZip;
  try {
    archive = await JSZip.loadAsync(bytes, {
      checkCRC32: false,
      createFolders: false,
    });
  } catch {
    throw new ResumeFileError(
      "The DOCX archive is malformed or could not be verified.",
      "MALFORMED_FILE",
    );
  }

  const entries = Object.values(archive.files);
  if (
    entries.length > MAX_ARCHIVE_ENTRIES ||
    entries.length !== centralEntries.length
  ) {
    throw new ResumeFileError(
      "The DOCX archive contains too many entries.",
      "UNSAFE_ARCHIVE",
    );
  }
  if (
    entries.some((entry) => {
      const unsafeOriginalName = (
        entry as typeof entry & { unsafeOriginalName?: string }
      ).unsafeOriginalName;
      return (
        unsafeArchivePath(entry.name) ||
        (unsafeOriginalName ? unsafeArchivePath(unsafeOriginalName) : false)
      );
    })
  ) {
    throw new ResumeFileError(
      "The DOCX archive contains an unsafe path.",
      "UNSAFE_ARCHIVE",
    );
  }
  if (
    entries.some((entry) =>
      /(?:vbaProject\.bin|macros|activeX|embeddings)/iu.test(entry.name),
    )
  ) {
    throw new ResumeFileError(
      "Macro-enabled or embedded content is not accepted.",
      "UNSAFE_ARCHIVE",
    );
  }

  const contentTypes = archive.file("[Content_Types].xml");
  const documentEntry = archive.file("word/document.xml");
  if (!contentTypes || !documentEntry) {
    throw new ResumeFileError(
      "The archive is not a valid Word document.",
      "MALFORMED_FILE",
    );
  }

  const [contentTypesXml, documentXml] = await Promise.all([
    contentTypes.async("string"),
    documentEntry.async("string"),
  ]);
  if (contentTypesXml.length + documentXml.length > MAX_EXPANDED_XML_BYTES) {
    throw new ResumeFileError(
      "The expanded DOCX content exceeds the safe processing limit.",
      "UNSAFE_ARCHIVE",
    );
  }
  if (/macroEnabled|vnd\.ms-office\.vba/iu.test(contentTypesXml)) {
    throw new ResumeFileError(
      "Macro-enabled Word documents are not accepted.",
      "UNSAFE_ARCHIVE",
    );
  }

  return {
    hasTable: /<w:tbl(?:\s|>)/u.test(documentXml),
    hasHeader: entries.some((entry) => /^word\/header\d+\.xml$/u.test(entry.name)),
    hasFooter: entries.some((entry) => /^word\/footer\d+\.xml$/u.test(entry.name)),
  };
}

export async function extractDocxResume(
  bytes: Uint8Array,
  filename: string,
): Promise<CanonicalResumeDocument> {
  const inspection = await inspectDocxArchive(bytes);
  let rawText: string;
  try {
    const result = await mammoth.extractRawText({
      arrayBuffer: bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer,
    });
    rawText = result.value;
  } catch {
    throw new ResumeFileError(
      "Text could not be extracted from the DOCX file.",
      "MALFORMED_FILE",
    );
  }

  const normalizedText = normalizeWhitespace(rawText);
  if (!normalizedText) {
    throw new ResumeFileError(
      "No readable text was found in the DOCX file.",
      "MALFORMED_FILE",
    );
  }

  const layoutSignals: LayoutSignal[] = [];
  if (inspection.hasTable) {
    layoutSignals.push({
      type: "table",
      page: 1,
      confidence: 0.96,
      detail: "A Word table was detected in the document XML.",
    });
  }
  if (inspection.hasHeader) {
    layoutSignals.push({
      type: "header",
      page: 1,
      confidence: 0.9,
      detail: "Header content may be separated from the main reading order.",
    });
  }
  if (inspection.hasFooter) {
    layoutSignals.push({
      type: "footer",
      page: 1,
      confidence: 0.9,
      detail: "Footer content may be separated from the main reading order.",
    });
  }

  return {
    version: 1,
    filename,
    fileType: "docx",
    pageCount: 1,
    normalizedText,
    spans: [
      {
        id: "docx-span-1",
        page: 1,
        text: normalizedText,
        start: 0,
        end: normalizedText.length,
      },
    ],
    sections: detectSections(normalizedText),
    layoutSignals,
    extractionConfidence: inspection.hasTable ? 0.86 : 0.94,
  };
}
