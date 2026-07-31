export const scoringWeights = {
  parseability: 0.2,
  alignment: 0.25,
  experience: 0.2,
  impact: 0.15,
  formatting: 0.1,
  readability: 0.1,
} as const;

export const analyzerConfig = {
  version: "1.0.0",
  schemaVersion: 1,
  maxFileBytes: 8 * 1024 * 1024,
  acceptedExtensions: [".pdf", ".docx", ".txt"],
  acceptedMimeTypes: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ],
} as const;
