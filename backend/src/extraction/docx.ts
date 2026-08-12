import { SaxesParser } from "saxes";
import { MAX_RESUME_CHARACTERS } from "../config/constants.js";
import { openSafeDocxArchive } from "../security/docx-archive.js";
import { ExtractionError } from "./errors.js";
import {
  assertEnoughText,
  buildCanonicalDocument,
  countWords,
  normalizeInlineText
} from "./normalization.js";
import type {
  CanonicalTextSpan,
  ExtractedResume,
  ExtractionWarning,
  LayoutSignals,
  ValidatedUpload
} from "./types.js";

const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });

type XmlAttribute = string | { local?: string; name?: string; value: string };
interface XmlTag {
  local?: string;
  name: string;
  attributes: Record<string, XmlAttribute>;
}

interface ParagraphDraft {
  page: number;
  text: string;
  kind: CanonicalTextSpan["kind"];
}

function decodeXml(data: Uint8Array): string {
  let xml: string;
  try {
    xml = UTF8_DECODER.decode(data).replace(/^\uFEFF/u, "");
  } catch (error) {
    throw new ExtractionError("MALFORMED_FILE", { cause: error });
  }

  if (/<!DOCTYPE|<!ENTITY/iu.test(xml)) {
    throw new ExtractionError("MALFORMED_FILE");
  }
  return xml;
}

function localName(tag: XmlTag): string {
  return tag.local ?? tag.name.split(":").at(-1) ?? tag.name;
}

function attributeValue(tag: XmlTag, wantedLocalName: string): string | undefined {
  for (const [name, attribute] of Object.entries(tag.attributes)) {
    if (typeof attribute === "string") {
      if ((name.split(":").at(-1) ?? name) === wantedLocalName) return attribute;
      continue;
    }
    if (
      attribute.local === wantedLocalName ||
      (attribute.name?.split(":").at(-1) ?? attribute.name) === wantedLocalName ||
      (name.split(":").at(-1) ?? name) === wantedLocalName
    ) {
      return attribute.value;
    }
  }
  return undefined;
}

function parseDocumentXml(xml: string, checkpoint: () => void): {
  paragraphs: ParagraphDraft[];
  layoutSignals: LayoutSignals;
} {
  const paragraphs: ParagraphDraft[] = [];
  let page = 1;
  let tableDepth = 0;
  let textBoxDepth = 0;
  let textDepth = 0;
  let paragraphActive = false;
  let paragraphPage = 1;
  let paragraphParts: string[] = [];
  let paragraphInTable = false;
  let paragraphIsList = false;
  let paragraphIsHeading = false;
  let tableCount = 0;
  let textBoxCount = 0;
  let columnCount = 1;
  let explicitPageBreaks = 0;

  const paragraphKind = (): CanonicalTextSpan["kind"] => {
    if (paragraphInTable) return "table-cell";
    if (paragraphIsList) return "list-item";
    if (paragraphIsHeading) return "heading";
    return "text";
  };

  const flushParagraphPart = (): void => {
    const raw = paragraphParts.join("");
    const text = normalizeInlineText(raw);
    paragraphParts = [];
    if (!text) return;
    paragraphs.push({
      page: paragraphPage,
      text: paragraphIsList && !/^[•●▪◦\-–—]/u.test(text) ? `• ${text}` : text,
      kind: paragraphKind()
    });
  };

  const resetParagraph = (): void => {
    paragraphActive = false;
    paragraphParts = [];
    paragraphInTable = false;
    paragraphIsList = false;
    paragraphIsHeading = false;
  };

  const parser = new SaxesParser({ xmlns: true });
  parser.on("opentag", (rawTag) => {
    checkpoint();
    const tag = rawTag as unknown as XmlTag;
    const name = localName(tag);

    if (name === "tbl") {
      tableDepth += 1;
      tableCount += 1;
      if (paragraphActive) paragraphInTable = true;
    } else if (name === "txbxContent") {
      textBoxDepth += 1;
      textBoxCount += 1;
    } else if (name === "p") {
      if (paragraphActive) flushParagraphPart();
      paragraphActive = true;
      paragraphPage = page;
      paragraphParts = [];
      paragraphInTable = tableDepth > 0;
      paragraphIsList = false;
      paragraphIsHeading = false;
    } else if (name === "t") {
      textDepth += 1;
    } else if (name === "numPr" && paragraphActive) {
      paragraphIsList = true;
    } else if (name === "pStyle" && paragraphActive) {
      const style = attributeValue(tag, "val") ?? "";
      paragraphIsHeading = /^heading|^title/iu.test(style);
    } else if (name === "tab" && paragraphActive) {
      paragraphParts.push("\t");
    } else if (name === "br" && paragraphActive) {
      const breakType = attributeValue(tag, "type");
      if (breakType === "page") {
        flushParagraphPart();
        explicitPageBreaks += 1;
        page += 1;
        paragraphPage = page;
      } else {
        paragraphParts.push("\n");
      }
    } else if (name === "cols") {
      const parsed = Number.parseInt(attributeValue(tag, "num") ?? "1", 10);
      if (Number.isFinite(parsed) && parsed > columnCount) {
        columnCount = Math.min(parsed, 8);
      }
    }
  });
  parser.on("text", (text) => {
    if (paragraphActive && textDepth > 0) paragraphParts.push(text);
  });
  parser.on("closetag", (rawTag) => {
    const tag = rawTag as unknown as { local?: string; name?: string };
    const name = tag.local ?? tag.name?.split(":").at(-1);
    if (name === "t") {
      textDepth = Math.max(0, textDepth - 1);
    } else if (name === "p") {
      flushParagraphPart();
      resetParagraph();
    } else if (name === "tbl") {
      tableDepth = Math.max(0, tableDepth - 1);
    } else if (name === "txbxContent") {
      textBoxDepth = Math.max(0, textBoxDepth - 1);
    }
  });

  try {
    parser.write(xml).close();
  } catch (error) {
    throw new ExtractionError("MALFORMED_FILE", { cause: error });
  }

  return {
    paragraphs,
    layoutSignals: {
      tableCount,
      textBoxCount,
      columnCount,
      explicitPageBreaks,
      hasHeadersOrFooters: false,
      readingOrderRisk: tableCount > 0 || textBoxCount > 0 || columnCount > 1
    }
  };
}

export function extractDocx(
  upload: ValidatedUpload,
  checkpoint: () => void = () => undefined
): ExtractedResume {
  checkpoint();
  const archive = openSafeDocxArchive(upload.data, checkpoint);
  const documentXml = decodeXml(archive.readEntry("word/document.xml"));
  checkpoint();
  if (documentXml.length > MAX_RESUME_CHARACTERS * 8) {
    throw new ExtractionError("CONTENT_LIMIT_EXCEEDED");
  }

  const parsed = parseDocumentXml(documentXml, checkpoint);
  parsed.layoutSignals.hasHeadersOrFooters = archive.entryNames.some((name) =>
    /^word\/(header|footer)\d*\.xml$/iu.test(name)
  );

  const document = buildCanonicalDocument(parsed.paragraphs, parsed.layoutSignals);
  checkpoint();
  assertEnoughText(document);
  const wordCount = countWords(document.text);
  const warnings: ExtractionWarning[] = [];
  if (parsed.layoutSignals.tableCount > 0) warnings.push("TABLE_LAYOUT");
  if (parsed.layoutSignals.textBoxCount > 0) warnings.push("TEXT_BOX_CONTENT");
  if (parsed.layoutSignals.columnCount > 1) warnings.push("MULTI_COLUMN_LAYOUT");
  if (parsed.layoutSignals.readingOrderRisk) warnings.push("READING_ORDER_UNCERTAIN");
  if (wordCount < 100) warnings.push("LOW_TEXT_DENSITY");

  return {
    fileName: upload.fileName,
    fileType: "docx",
    text: document.text,
    wordCount,
    pageCount: document.pages.length,
    document,
    layoutSignals: parsed.layoutSignals,
    warnings
  };
}
