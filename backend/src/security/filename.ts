const PATH_SEPARATORS = /[\\/\u2044\u2215]+/gu;
const RESERVED_CHARACTERS = /[<>:"|?*]/gu;
const MAX_DISPLAY_NAME_LENGTH = 120;

function isControlOrBidi(code: number): boolean {
  return (
    code <= 31 ||
    (code >= 127 && code <= 159) ||
    code === 0x061c ||
    (code >= 0x200b && code <= 0x200f) ||
    (code >= 0x202a && code <= 0x202e) ||
    code === 0x2060 ||
    (code >= 0x2066 && code <= 0x2069) ||
    code === 0xfeff
  );
}

function stripControlAndBidi(value: string): string {
  let result = "";
  for (const character of value) {
    const code = character.codePointAt(0);
    if (code === undefined || !isControlOrBidi(code)) result += character;
  }
  return result;
}

function truncatePreservingExtension(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;

  const dot = value.lastIndexOf(".");
  const extension = dot > 0 && value.length - dot <= 12 ? value.slice(dot) : "";
  const baseLength = Math.max(1, maxLength - extension.length);
  return `${value.slice(0, baseLength)}${extension}`;
}

export function sanitizeFileName(input: string): string {
  const normalized = stripControlAndBidi(input.normalize("NFKC"));
  const basename = normalized.split(PATH_SEPARATORS).at(-1) ?? "";
  const safe = basename
    .replace(RESERVED_CHARACTERS, "-")
    .replace(/\s+/gu, " ")
    .replace(/^\.+|[. ]+$/gu, "")
    .trim();

  return truncatePreservingExtension(safe || "resume", MAX_DISPLAY_NAME_LENGTH);
}
