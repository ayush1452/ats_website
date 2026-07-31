import type {
  CanonicalResumeDocument,
  ResumeAnnotation,
  ResumeSection,
  Severity,
} from "@/types/domain";

const WORD_PATTERN = /[\p{L}\p{N}][\p{L}\p{N}'’+\-./#]*/gu;
const SENTENCE_PATTERN = /[^.!?\n]+[.!?]?/g;
const VOWEL_GROUP_PATTERN = /[aeiouy]+/g;

export const WEAK_VERBS = [
  "assisted",
  "helped",
  "handled",
  "participated",
  "responsible",
  "supported",
  "worked",
  "involved",
  "contributed",
  "tasked",
] as const;

export const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "have",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "our",
  "that",
  "the",
  "their",
  "this",
  "to",
  "we",
  "will",
  "with",
  "you",
  "your",
  "years",
  "experience",
  "role",
  "team",
  "work",
  "skills",
  "ability",
]);

export function clamp(value: number, minimum = 0, maximum = 100): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function round(value: number, precision = 0): number {
  const multiplier = 10 ** precision;
  return Math.round(value * multiplier) / multiplier;
}

export function normalizeWhitespace(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function words(value: string): string[] {
  return value.match(WORD_PATTERN) ?? [];
}

export function sentences(value: string): string[] {
  return (value.match(SENTENCE_PATTERN) ?? [])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function syllablesInWord(input: string): number {
  const word = input.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;

  const withoutSilentEnding = word
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "");
  return Math.max(1, withoutSilentEnding.match(VOWEL_GROUP_PATTERN)?.length ?? 1);
}

export interface ReadabilityStats {
  words: number;
  sentences: number;
  syllables: number;
  fleschEase: number;
  gradeLevel: number;
  score: number;
}

export function calculateReadability(value: string): ReadabilityStats {
  const allWords = words(value);
  const allSentences = sentences(value);
  const wordCount = Math.max(1, allWords.length);
  const sentenceCount = Math.max(1, allSentences.length);
  const syllableCount = allWords.reduce((sum, word) => sum + syllablesInWord(word), 0);
  const fleschEase =
    206.835 -
    1.015 * (wordCount / sentenceCount) -
    84.6 * (syllableCount / wordCount);
  const gradeLevel =
    0.39 * (wordCount / sentenceCount) +
    11.8 * (syllableCount / wordCount) -
    15.59;

  return {
    words: allWords.length,
    sentences: allSentences.length,
    syllables: syllableCount,
    fleschEase: round(clamp(fleschEase), 1),
    gradeLevel: round(clamp(gradeLevel, 0, 20), 1),
    score: round(clamp(fleschEase), 0),
  };
}

function normalizedTokens(value: string): string[] {
  return words(value).map((word) => word.toLocaleLowerCase());
}

export function phraseFrequency(value: string, phrase: string): number {
  const haystack = normalizedTokens(value);
  const needle = normalizedTokens(phrase);
  if (needle.length === 0 || haystack.length < needle.length) return 0;

  let frequency = 0;
  for (let index = 0; index <= haystack.length - needle.length; index += 1) {
    if (needle.every((token, offset) => haystack[index + offset] === token)) {
      frequency += 1;
    }
  }
  return frequency;
}

export function extractKeywords(value: string, limit = 24): string[] {
  const candidates = words(value)
    .map((word) => word.toLocaleLowerCase())
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
  const counts = new Map<string, number>();
  for (const candidate of candidates) {
    counts.set(candidate, (counts.get(candidate) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([a, aCount], [b, bCount]) => bCount - aCount || a.localeCompare(b))
    .slice(0, Math.max(0, limit))
    .map(([keyword]) =>
      keyword
        .split(/[-/]/)
        .map((part) => (part.length <= 3 ? part.toUpperCase() : `${part[0]?.toUpperCase()}${part.slice(1)}`))
        .join(" "),
    );
}

export function keywordStuffingRatio(value: string, keyword: string): number {
  const count = phraseFrequency(value, keyword);
  const wordCount = Math.max(1, words(value).length);
  return round((count * Math.max(1, words(keyword).length)) / wordCount, 4);
}

export function detectWeakVerbs(value: string): Array<{ verb: string; start: number; end: number }> {
  const findings: Array<{ verb: string; start: number; end: number }> = [];
  const pattern = new RegExp(`\\b(${WEAK_VERBS.join("|")})\\b`, "giu");
  for (const match of value.matchAll(pattern)) {
    if (match.index === undefined) continue;
    findings.push({
      verb: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return findings;
}

export function hasQuantifiedOutcome(value: string): boolean {
  return /(?:[$£€]\s?\d|(?:\d+(?:[.,]\d+)?)\s?(?:%|x\b|k\b|m\b|million\b|billion\b|users?\b|customers?\b|hours?\b|days?\b|weeks?\b|months?\b|years?\b))/iu.test(
    value,
  );
}

export function bulletLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^(?:[-•▪◦*]|\d+[.)])\s+/.test(line));
}

export interface DateConsistency {
  consistent: boolean;
  formats: Array<"named-month" | "numeric" | "year-only">;
  occurrences: number;
}

export function inspectDateConsistency(value: string): DateConsistency {
  const named =
    value.match(
      /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{4}\b/giu,
    ) ?? [];
  const numeric = value.match(/\b(?:0?[1-9]|1[0-2])[/-](?:19|20)\d{2}\b/g) ?? [];
  const yearOnly = value.match(/\b(?:19|20)\d{2}\b/g) ?? [];

  const formats: DateConsistency["formats"] = [];
  if (named.length > 0) formats.push("named-month");
  if (numeric.length > 0) formats.push("numeric");
  if (yearOnly.length > named.length + numeric.length) formats.push("year-only");

  return {
    consistent: formats.length <= 1,
    formats,
    occurrences: named.length + numeric.length + yearOnly.length,
  };
}

const SECTION_ALIASES: Array<{ name: string; pattern: RegExp }> = [
  { name: "Summary", pattern: /^(?:professional\s+)?(?:summary|profile|objective)$/imu },
  { name: "Experience", pattern: /^(?:work\s+|professional\s+)?experience|employment(?:\s+history)?$/imu },
  { name: "Skills", pattern: /^(?:technical\s+|core\s+)?skills|competencies|expertise$/imu },
  { name: "Education", pattern: /^education|academic(?:\s+background)?$/imu },
  { name: "Projects", pattern: /^(?:selected\s+)?projects$/imu },
  { name: "Certifications", pattern: /^certifications?|licenses?$/imu },
];

export function detectSections(value: string): ResumeSection[] {
  const starts = SECTION_ALIASES.flatMap(({ name, pattern }) => {
    const match = pattern.exec(value);
    if (!match || match.index === undefined) return [];
    return [{ name, heading: match[0].trim(), start: match.index }];
  }).sort((a, b) => a.start - b.start);

  return starts.map((section, index) => ({
    id: `section-${section.name.toLowerCase().replace(/\s+/g, "-")}`,
    name: section.name,
    heading: section.heading,
    start: section.start,
    end: starts[index + 1]?.start ?? value.length,
    order: index,
    confidence: 0.92,
  }));
}

export function textPageAt(document: CanonicalResumeDocument, offset: number): number {
  const containingSpan = document.spans.find(
    (span) => offset >= span.start && offset <= span.end,
  );
  return containingSpan?.page ?? 1;
}

export function createAnnotation(input: {
  id: string;
  findingId: string;
  document: CanonicalResumeDocument;
  sourceText: string;
  severity: Severity;
  label: string;
  occurrence?: number;
}): ResumeAnnotation | null {
  const occurrence = Math.max(0, input.occurrence ?? 0);
  let start = -1;
  let fromIndex = 0;

  for (let index = 0; index <= occurrence; index += 1) {
    start = input.document.normalizedText.indexOf(input.sourceText, fromIndex);
    if (start < 0) return null;
    fromIndex = start + input.sourceText.length;
  }

  return {
    id: input.id,
    findingId: input.findingId,
    start,
    end: start + input.sourceText.length,
    page: textPageAt(input.document, start),
    status: input.severity,
    label: input.label,
  };
}

export function makeTextDocument(input: {
  text: string;
  filename?: string;
  fileType?: CanonicalResumeDocument["fileType"];
}): CanonicalResumeDocument {
  const normalizedText = normalizeWhitespace(input.text);
  return {
    version: 1,
    filename: input.filename ?? "pasted-resume.txt",
    fileType: input.fileType ?? "pasted",
    pageCount: 1,
    normalizedText,
    spans: [
      {
        id: "span-1",
        page: 1,
        text: normalizedText,
        start: 0,
        end: normalizedText.length,
      },
    ],
    sections: detectSections(normalizedText),
    layoutSignals: [],
    extractionConfidence: 0.98,
  };
}
