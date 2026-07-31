import type { LucideIcon } from "lucide-react";
import {
  Braces,
  FileDiff,
  FileSearch,
  Goal,
  ScanText,
  Sparkles,
} from "lucide-react";

import { productConfig } from "@/config/product";

export type FeatureSlug =
  | "ats-parser"
  | "job-match"
  | "keyword-analysis"
  | "impact-analysis"
  | "ai-rewrite"
  | "version-comparison";

export interface FeatureFaq {
  question: string;
  answer: string;
}

export interface FeatureExample {
  label: string;
  before: string;
  after: string;
  note: string;
}

export interface Feature {
  slug: FeatureSlug;
  name: string;
  shortName: string;
  eyebrow: string;
  headline: string;
  description: string;
  problem: string;
  outcome: string;
  icon: LucideIcon;
  accent: "mint" | "blue" | "amber" | "coral" | "violet";
  capabilities: Array<{
    title: string;
    description: string;
  }>;
  steps: Array<{
    title: string;
    description: string;
  }>;
  example: FeatureExample;
  faq: FeatureFaq[];
}

export const features: Feature[] = [
  {
    slug: "ats-parser",
    name: "ATS parsing and format checks",
    shortName: "ATS Parser",
    eyebrow: "Parse with confidence",
    headline: "See the document an automated parser may actually read.",
    description:
      "Inspect extracted text, section detection, contact fields, and layout signals before a formatting choice hides important evidence.",
    problem:
      "A polished document can still produce an incomplete text stream. Tables, sidebars, text boxes, decorative icons, headers, and unusual headings may change what a parser extracts.",
    outcome:
      "You get a plain-text preview, a confidence estimate, and findings separated into likely blockers and lower-risk improvements.",
    icon: ScanText,
    accent: "coral",
    capabilities: [
      {
        title: "Layout risk detection",
        description:
          "Flag supported signals for columns, tables, text boxes, images, headers, footers, and reading-order problems.",
      },
      {
        title: "Section extraction",
        description:
          "Check whether contact details, experience, skills, education, projects, and certifications were identified.",
      },
      {
        title: "Severity that makes sense",
        description:
          "Separate critical extraction blockers from high, medium, low, and passed checks so effort follows risk.",
      },
      {
        title: "Plain-text proof",
        description:
          "Review an approximate parser output beside your source resume instead of trusting a single score.",
      },
    ],
    steps: [
      {
        title: "Extract",
        description: `${productConfig.name} normalizes supported PDF, DOCX, and TXT content into a stable document model.`,
      },
      {
        title: "Inspect",
        description: "Deterministic checks look for reading-order, structural, encoding, and contact-field issues.",
      },
      {
        title: "Connect",
        description: "Each finding points to the relevant location and explains the practical repair.",
      },
    ],
    example: {
      label: "Skills section",
      before: "Two-column table: Strategy | Tools | Leadership",
      after: "SKILLS\nStrategy: Product roadmap, GTM\nTools: Jira, Figma, Mixpanel",
      note: "A single-column skills section creates a clearer reading order while preserving the same facts.",
    },
    faq: [
      {
        question: "Does a format warning mean every ATS will reject my resume?",
        answer:
          `No. ${productConfig.name} identifies supported layout signals and extraction risks; it does not emulate or claim access to every third-party ATS.`,
      },
      {
        question: `Can ${productConfig.name} read scanned image-only PDFs?`,
        answer:
          "OCR is outside the current version. Image-only or encrypted files are identified as unparseable so you can provide a text-based copy.",
      },
      {
        question: "Will it redesign my resume automatically?",
        answer:
          "No. It explains what was detected and offers practical fixes. You decide which changes belong in your source document.",
      },
    ],
  },
  {
    slug: "job-match",
    name: "Job-description matching",
    shortName: "Job Match",
    eyebrow: "Evidence, not guesswork",
    headline: "Turn a long job description into a clear evidence map.",
    description:
      "Separate must-haves, preferences, tools, leadership expectations, domain signals, and outcomes—then see where your resume supports each one.",
    problem:
      "Job descriptions mix essential requirements with broad wish lists. Repeating every phrase can make a resume less credible, while missing a decisive requirement can make fit difficult to see.",
    outcome:
      "Requirements are weighted and labeled strong, partial, related, missing, or uncertain, with the exact resume evidence shown beside them.",
    icon: Goal,
    accent: "blue",
    capabilities: [
      {
        title: "Requirement classification",
        description:
          "Organize responsibilities, must-haves, preferences, seniority, domain, tools, leadership, and business outcomes.",
      },
      {
        title: "Evidence locations",
        description:
          "Trace a match back to the summary, skills, a specific experience bullet, project, or certification.",
      },
      {
        title: "Weighted coverage",
        description:
          "Prioritize requirements by role importance instead of treating every repeated word as equally valuable.",
      },
      {
        title: "Honest uncertainty",
        description:
          "Keep ambiguous or unsupported matches visible so users can verify context rather than accept a false positive.",
      },
    ],
    steps: [
      {
        title: "Classify the role",
        description: "Identify the likely title, seniority, domain, responsibilities, and outcomes.",
      },
      {
        title: "Map the evidence",
        description: "Connect requirements to explicit, related, partial, or absent resume evidence.",
      },
      {
        title: "Prioritize the gaps",
        description: "Focus first on important, truthful evidence that is difficult for a reviewer to find.",
      },
    ],
    example: {
      label: "Revenue KPI ownership",
      before: "Managed the product roadmap and worked with go-to-market teams.",
      after: "Owned the platform roadmap and partnered with GTM leaders on activation and expansion reporting.",
      note: "This clarifies collaboration, but it still needs a verified revenue or business outcome before claiming one.",
    },
    faq: [
      {
        question: "Is a higher match score a guarantee of an interview?",
        answer:
          "No. The role-match score is a product heuristic that explains visible evidence and gaps. Hiring decisions depend on many factors outside the resume.",
      },
      {
        question: "What happens if I scan without a job description?",
        answer:
          "General parseability, experience, impact, formatting, and readability checks still run. Job-match metrics are shown as unavailable, not zero.",
      },
      {
        question: "Should I add every missing requirement?",
        answer:
          "Only add skills, tools, outcomes, and experience you can support truthfully. A gap can be useful information without becoming resume copy.",
      },
    ],
  },
  {
    slug: "keyword-analysis",
    name: "Keyword and skills analysis",
    shortName: "Keyword Analysis",
    eyebrow: "Natural role language",
    headline: "Find the role signals your experience already supports.",
    description:
      "Group terms by meaning, compare frequency, spot related evidence, and choose natural placement without turning your resume into a keyword list.",
    problem:
      "Raw keyword counts reward repetition without context. They miss synonyms, overvalue incidental terms, and can encourage awkward stuffing.",
    outcome:
      `${productConfig.name} combines exact frequency with related-term context, requirement weight, evidence, and suggested placement.`,
    icon: Braces,
    accent: "mint",
    capabilities: [
      {
        title: "Meaningful groups",
        description:
          "Review core role signals, execution skills, tools, domain knowledge, leadership, and outcome language separately.",
      },
      {
        title: "Match states",
        description:
          "Distinguish strong, exact, partial, related, missing, and overused terms with text labels as well as color.",
      },
      {
        title: "Frequency context",
        description:
          "Compare job-description and resume frequency without pretending repetition alone improves relevance.",
      },
      {
        title: "Placement guidance",
        description:
          "Choose a credible home in the summary, skills, experience, projects, or certifications.",
      },
    ],
    steps: [
      {
        title: "Group",
        description: "Organize role language into readable signal groups and requirement types.",
      },
      {
        title: "Verify",
        description: "Check exact and related evidence against where it appears in your resume.",
      },
      {
        title: "Place naturally",
        description: "Add only truthful terms where they clarify an existing example or skill.",
      },
    ],
    example: {
      label: "GTM strategy",
      before: "Partnered with marketing and sales for launches.",
      after: "Partnered with marketing and sales on GTM planning for three platform launches.",
      note: "Use the explicit term only if GTM planning accurately describes the work.",
    },
    faq: [
      {
        question: `How does ${productConfig.name} handle synonyms?`,
        answer:
          "Related phrases can be marked as contextual evidence, but the report keeps exact and related matches separate so you can judge whether explicit wording would be clearer.",
      },
      {
        question: "How many times should a keyword appear?",
        answer:
          "There is no universal target. Use a term where it accurately explains skills or outcomes; the report warns about repetition that appears unnatural.",
      },
      {
        question: "Does keyword matching replace a human review?",
        answer:
          "No. It helps make role evidence easier to find, while a human still evaluates depth, credibility, and relevance.",
      },
    ],
  },
  {
    slug: "impact-analysis",
    name: "Achievement and impact analysis",
    shortName: "Impact Analysis",
    eyebrow: "Make the work concrete",
    headline: "Show what changed because you were there.",
    description:
      "Find responsibility-only bullets, weak phrases, missing scope, and unproven outcomes—without inventing a metric.",
    problem:
      "Many resumes explain duties but leave the scale, decision, outcome, or business relevance implicit. Reviewers then have to infer the candidate’s contribution.",
    outcome:
      "Bullet-level findings explain what is missing and prompt for a truthful quantity, outcome, scope, or decision where one would improve clarity.",
    icon: FileSearch,
    accent: "amber",
    capabilities: [
      {
        title: "Achievement density",
        description:
          "Measure the share of bullets that contain a concrete action and outcome signal.",
      },
      {
        title: "Responsibility detection",
        description:
          "Find phrases such as “responsible for,” “helped with,” and “worked on” that may hide ownership.",
      },
      {
        title: "Scope and scale prompts",
        description:
          "Ask for verified users, teams, markets, time saved, revenue, quality, or adoption context when appropriate.",
      },
      {
        title: "Tone signals",
        description:
          "Review confidence, clarity, specificity, repetition, passive phrasing, vagueness, and overstatement.",
      },
    ],
    steps: [
      {
        title: "Find the action",
        description: "Identify the decision, contribution, or ownership described in each bullet.",
      },
      {
        title: "Look for evidence",
        description: "Check for a truthful outcome, quantity, scope, or quality signal.",
      },
      {
        title: "Strengthen carefully",
        description: "Use prompts and structures that preserve facts and leave unknown values visibly incomplete.",
      },
    ],
    example: {
      label: "Activation experiment",
      before: "Worked on onboarding improvements with design and engineering.",
      after: "Led onboarding experiments with design and engineering, improving activation by [X%].",
      note: "Replace [X%] only with a metric you can verify. If no metric exists, name the observable outcome instead.",
    },
    faq: [
      {
        question: `Will ${productConfig.name} invent numbers for my bullets?`,
        answer:
          "No. When a useful metric is missing, suggestions use a visible placeholder or ask a question so you can supply verified evidence.",
      },
      {
        question: "Do all bullets need a number?",
        answer:
          "No. Clear scope, quality, customer, decision, or operational outcomes can also demonstrate impact.",
      },
      {
        question: "What is achievement density?",
        answer:
          "It is a transparent heuristic: the share of eligible bullets with observable action and outcome signals. It is context, not a hiring benchmark.",
      },
    ],
  },
  {
    slug: "ai-rewrite",
    name: "AI-assisted rewrites",
    shortName: "AI Rewrite",
    eyebrow: "You keep control",
    headline: "Improve the sentence without changing the story.",
    description:
      "Review the original, proposed wording, rationale, and factuality warning before copying, editing, applying, or rejecting a suggestion.",
    problem:
      "A rewrite can sound polished while quietly adding ownership, tools, or outcomes that were never true. Automatic replacement makes that risk hard to notice.",
    outcome:
      "Every suggestion stays inspectable and optional. Applying one creates a new resume version so the original remains available.",
    icon: Sparkles,
    accent: "violet",
    capabilities: [
      {
        title: "Visible changes",
        description:
          "See original and proposed language together, with a concise explanation of what changed and why.",
      },
      {
        title: "Factuality reminders",
        description:
          "Confirm skills, ownership, scope, metrics, and outcomes before any suggestion becomes resume content.",
      },
      {
        title: "Granular controls",
        description:
          "Copy, edit, apply, reject, or regenerate without silently modifying the source.",
      },
      {
        title: "Version safety",
        description:
          "Applied changes create an immutable version and mark the previous analysis as stale until rescanned.",
      },
    ],
    steps: [
      {
        title: "Choose a finding",
        description: "Start from a specific clarity, impact, keyword, or tailoring opportunity.",
      },
      {
        title: "Inspect the proposal",
        description: "Compare wording, rationale, and factual claims against your actual experience.",
      },
      {
        title: "Decide",
        description: "Edit or apply a verified suggestion, or reject it without changing the resume.",
      },
    ],
    example: {
      label: "Roadmap ownership",
      before: "Responsible for product roadmap and stakeholder updates.",
      after: "Owned the platform roadmap and aligned quarterly priorities with product, engineering, and GTM stakeholders.",
      note: "Apply only if roadmap ownership and the listed stakeholder groups are accurate.",
    },
    faq: [
      {
        question: "Are suggestions applied automatically?",
        answer:
          "Never. You must confirm an application, and the product preserves the previous version.",
      },
      {
        question: "What if no AI provider is configured?",
        answer:
          "The product uses deterministic sample suggestions and labels the result “Demo analysis.” It does not pretend a live model ran.",
      },
      {
        question: "Can I restore my original wording?",
        answer:
          "Yes. Applied changes create a new version, so you can compare or restore earlier content.",
      },
    ],
  },
  {
    slug: "version-comparison",
    name: "Resume version comparison",
    shortName: "Version Comparison",
    eyebrow: "Know what improved",
    headline: "Compare the evidence, not just the final score.",
    description:
      "See score deltas, resolved and new findings, keyword changes, and an exact text diff between any two saved versions.",
    problem:
      "Editing without a baseline makes it difficult to know which changes clarified the document, introduced a new issue, or simply moved the score.",
    outcome:
      "A structured comparison connects dimension changes to the actual copy and findings that changed between versions.",
    icon: FileDiff,
    accent: "blue",
    capabilities: [
      {
        title: "Dimension deltas",
        description:
          "Compare overall, parse, role-match, clarity, keyword, impact, and formatting scores on a consistent scale.",
      },
      {
        title: "Finding lifecycle",
        description:
          "Separate resolved, unchanged, and newly introduced findings.",
      },
      {
        title: "Keyword movement",
        description:
          "Review added and removed terms with match status and supporting evidence.",
      },
      {
        title: "Readable text diff",
        description:
          "Switch between side-by-side and unified views and inspect the saved-version timeline.",
      },
    ],
    steps: [
      {
        title: "Choose two versions",
        description: "Pick any saved baseline and revision from the resume timeline.",
      },
      {
        title: "Review the deltas",
        description: "See what changed across scores, findings, keywords, and source text.",
      },
      {
        title: "Keep or restore",
        description: "Continue from the stronger version or restore a previous one without losing history.",
      },
    ],
    example: {
      label: "Version 2 compared with version 1",
      before: "Overall 65 · Formatting 40 · 4 high-impact findings",
      after: "Overall 73 · Formatting 76 · 1 high-impact finding",
      note: "The comparison attributes the change to resolved layout risks and stronger outcome evidence, not a guaranteed hiring result.",
    },
    faq: [
      {
        question: "Does editing overwrite my current resume?",
        answer:
          "No. Applied edits create a new immutable version and keep the earlier content in the timeline.",
      },
      {
        question: "Can I compare versions created for different roles?",
        answer:
          "Yes, but role-match deltas are most meaningful when both scans use the same job description.",
      },
      {
        question: "Why might a score decrease after an edit?",
        answer:
          "A new version can introduce layout, readability, keyword, or evidence issues. The comparison shows the associated findings so you can evaluate the tradeoff.",
      },
    ],
  },
];

export const featureBySlug = Object.fromEntries(
  features.map((feature) => [feature.slug, feature]),
) as Record<FeatureSlug, Feature>;
