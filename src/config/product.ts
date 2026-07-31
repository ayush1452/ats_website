const noTrainingVerified =
  process.env.NEXT_PUBLIC_AI_DATA_TRAINING_DISABLED === "true";

const conservativeUploadCopy =
  "Your resume is processed only to create your report. Review the privacy policy for provider-specific handling.";
const noTrainingCopy =
  "Your resume is private and is not used to train public models.";

export const productConfig = {
  name: "ResumePilot",
  shortName: "RP",
  slug: "resumepilot",
  description:
    "A transparent resume analysis workspace for parseability, role alignment, recruiter clarity, and evidence-led improvements.",
  domain: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  supportEmail: "support@resumepilot.example",
  legalEmail: "privacy@resumepilot.example",
  privacy: {
    conservativeUploadCopy,
    demoUploadCopy:
      "Demo analysis uses this app’s deterministic endpoint. The result is retained on this device and is not sent to an AI provider.",
    noTrainingCopy,
    uploadAssurance: noTrainingVerified ? noTrainingCopy : conservativeUploadCopy,
    noTrainingVerified,
  },
  socialLinks: {
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL,
    x: process.env.NEXT_PUBLIC_X_URL,
  },
} as const;

export type ProductConfig = typeof productConfig;
