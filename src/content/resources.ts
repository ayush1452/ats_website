import { productConfig } from "@/config/product";

export type ResourceCategory = "ATS fundamentals" | "Tailoring" | "Writing" | "Privacy";

export type ResourceSlug =
  | "read-your-resume-like-a-parser"
  | "job-description-evidence-map"
  | "keyword-matching-without-stuffing"
  | "write-impact-without-inventing-metrics"
  | "resume-formatting-risk-checklist"
  | "privacy-questions-before-uploading-a-resume";

export interface ResourceSection {
  heading: string;
  paragraphs: string[];
  checklist?: string[];
}

export interface Resource {
  slug: ResourceSlug;
  title: string;
  description: string;
  category: ResourceCategory;
  readingTime: string;
  published: string;
  takeaways: string[];
  sections: ResourceSection[];
}

export const resources: Resource[] = [
  {
    slug: "read-your-resume-like-a-parser",
    title: "How to read your resume like a parser",
    description:
      "A practical way to check extraction order, headings, contact fields, and layout signals before applying.",
    category: "ATS fundamentals",
    readingTime: "7 min read",
    published: "July 8, 2026",
    takeaways: [
      "Copy the document into plain text and inspect the reading order.",
      "Use conventional headings for essential sections.",
      "Treat parser output as a diagnostic, not a hiring prediction.",
    ],
    sections: [
      {
        heading: "Start with the extracted text",
        paragraphs: [
          "A resume has two presentations: the document you designed and the text another system can extract. Begin by copying the content into a plain-text editor. Read it from top to bottom without correcting the order in your head.",
          "Look for missing contact information, split sentences, rearranged columns, repeated headers, unusual symbols, and section names detached from their content. These are observable extraction issues; they do not prove how every employer system will behave.",
        ],
      },
      {
        heading: "Check the structural landmarks",
        paragraphs: [
          "Clear section names help both people and software orient themselves. Experience, Skills, Education, Projects, and Certifications are easier to recognize than a creative heading that needs interpretation.",
        ],
        checklist: [
          "Name and contact fields appear once and near the beginning.",
          "Job title, employer, location, and dates stay together.",
          "Bullets appear after the correct role.",
          "Skills remain in a predictable reading order.",
          "Headers and footers do not contain essential information.",
        ],
      },
      {
        heading: "Prioritize actual loss",
        paragraphs: [
          "A decorative line is less important than a missing job title. Rank repairs by information loss: unreadable content first, uncertain order second, and cosmetic consistency last.",
          `${productConfig.name} follows the same principle by separating likely blockers from lower-severity recommendations and exposing a plain-text preview.`,
        ],
      },
    ],
  },
  {
    slug: "job-description-evidence-map",
    title: "Build a job-description evidence map",
    description:
      "Separate must-haves from preferences and connect each requirement to a truthful example in your resume.",
    category: "Tailoring",
    readingTime: "8 min read",
    published: "July 3, 2026",
    takeaways: [
      "Classify requirements before rewriting.",
      "Record the location and strength of every evidence match.",
      "Leave honest gaps instead of manufacturing support.",
    ],
    sections: [
      {
        heading: "Turn prose into requirements",
        paragraphs: [
          "Job descriptions blend responsibilities, qualifications, tools, behaviors, and company context. Split each statement into a single requirement and classify it as must-have, preferred, responsibility, tool, leadership signal, domain signal, or outcome.",
          "Repeated or prominent requirements may deserve more attention, but frequency is not a perfect measure of importance. Look at the role title, minimum qualifications, and responsibilities together.",
        ],
      },
      {
        heading: "Give every requirement a status",
        paragraphs: [
          "Use strong, partial, related, missing, and uncertain. Strong means the resume contains direct evidence. Partial means part of the requirement is supported. Related means the experience may transfer but the explicit skill is absent. Uncertain means you need more context.",
        ],
        checklist: [
          "Quote the evidence rather than relying on memory.",
          "Record the section or role where it appears.",
          "Note whether the evidence shows use, ownership, or outcome.",
          "Mark unsupported requirements as gaps.",
        ],
      },
      {
        heading: "Rewrite only where clarity improves",
        paragraphs: [
          "An exact term can help when it accurately names work already described. It should not be added only because a phrase occurs often in the job description.",
          "Start with the most important requirement that has real but hard-to-find evidence. Improving that connection is usually more credible than adding a long skills list.",
        ],
      },
    ],
  },
  {
    slug: "keyword-matching-without-stuffing",
    title: "Keyword matching without stuffing",
    description:
      "Use exact and related role language where it clarifies evidence, while avoiding awkward repetition.",
    category: "Tailoring",
    readingTime: "6 min read",
    published: "June 25, 2026",
    takeaways: [
      "Group terms by role signal rather than alphabetically.",
      "Distinguish exact matches from related experience.",
      "Place terms beside proof and monitor repetition.",
    ],
    sections: [
      {
        heading: "Keywords are labels for evidence",
        paragraphs: [
          "A useful role term helps a reviewer understand an example more quickly. It does not substitute for the example. “Product roadmap” is stronger beside a decision, scope, or outcome than repeated in a summary and skills block.",
          "Group terms into role signals, execution skills, tools, domain language, leadership, and outcomes. This makes gaps easier to interpret.",
        ],
      },
      {
        heading: "Exact, related, and partial are different",
        paragraphs: [
          "A synonym may demonstrate relevant experience while still leaving the employer’s preferred term absent. Keep those states separate. Add the explicit term only when it truthfully describes the work.",
        ],
        checklist: [
          "Use the term in a grammatically natural sentence.",
          "Keep the strongest evidence in work or project experience.",
          "Avoid repeating a tool in every section.",
          "Read the revised sentence aloud.",
        ],
      },
      {
        heading: "Watch for diminishing returns",
        paragraphs: [
          "More repetitions do not mean more relevance. If removing one occurrence makes the resume easier to read without reducing evidence, remove it.",
        ],
      },
    ],
  },
  {
    slug: "write-impact-without-inventing-metrics",
    title: "Write impact without inventing metrics",
    description:
      "Make responsibility bullets more specific using truthful outcomes, scope, quality, and decision evidence.",
    category: "Writing",
    readingTime: "9 min read",
    published: "June 18, 2026",
    takeaways: [
      "A useful bullet needs a contribution and an observable consequence.",
      "Numbers are only one kind of evidence.",
      "Keep unknown values as questions or visible placeholders.",
    ],
    sections: [
      {
        heading: "Move beyond the task",
        paragraphs: [
          "“Responsible for” tells the reader that a task belonged to you, but not how you approached it or what changed. Name the decision, system, customer, or collaboration that made the work meaningful.",
          "Then look for an observable consequence: speed, adoption, quality, reliability, revenue, cost, customer behavior, risk reduction, or organizational scope.",
        ],
      },
      {
        heading: "Use evidence you can defend",
        paragraphs: [
          "A precise number is useful only if it is accurate. When an exact metric is unavailable, use other verified context: number of teams, regions, products, stakeholders, launch stage, decision authority, or a qualitative outcome.",
        ],
        checklist: [
          "What did I decide, build, change, or lead?",
          "Who or what was affected?",
          "What was the scale or constraint?",
          "What observable result followed?",
          "Can I explain and verify every claim?",
        ],
      },
      {
        heading: "Use placeholders responsibly",
        paragraphs: [
          "A draft such as “reduced processing time by [X%]” is a question, not finished resume copy. Keep the brackets visible until you can supply a verified value, or rewrite the result without a number.",
        ],
      },
    ],
  },
  {
    slug: "resume-formatting-risk-checklist",
    title: "A practical resume formatting risk checklist",
    description:
      "Review columns, tables, typography, dates, headings, and file output without flattening your document into a generic template.",
    category: "ATS fundamentals",
    readingTime: "7 min read",
    published: "June 10, 2026",
    takeaways: [
      "Protect content order before visual decoration.",
      "Keep essential text out of headers, footers, icons, and images.",
      "Test the exported file, not only the source editor.",
    ],
    sections: [
      {
        heading: "Reading order comes first",
        paragraphs: [
          "Columns and tables can create an ambiguous extraction sequence. They are not automatically wrong, but essential content should remain understandable when read linearly.",
        ],
        checklist: [
          "Contact information extracts as text.",
          "Dates stay with the correct employer and role.",
          "Skills read in the intended order.",
          "No essential label is conveyed only by an icon.",
          "Section headings use text rather than an image.",
        ],
      },
      {
        heading: "Check consistency and legibility",
        paragraphs: [
          "Use readable font sizes, a consistent date style, clear spacing between roles, and recognizable headings. Avoid using tiny text to force an extra line onto the page.",
        ],
      },
      {
        heading: "Inspect the final export",
        paragraphs: [
          "PDF and DOCX exports can differ from the editor view. Open the actual file, search for important terms, copy its text, and inspect page breaks before submitting it.",
        ],
      },
    ],
  },
  {
    slug: "privacy-questions-before-uploading-a-resume",
    title: "Privacy questions to ask before uploading a resume",
    description:
      "A plain-language checklist for storage, providers, retention, deletion, sharing, and account controls.",
    category: "Privacy",
    readingTime: "6 min read",
    published: "June 2, 2026",
    takeaways: [
      "Understand where the file is stored and which providers process it.",
      "Look for retention, export, and deletion controls.",
      "Remove information a resume service does not need.",
    ],
    sections: [
      {
        heading: "Know the data path",
        paragraphs: [
          "A resume can include a name, location, contact details, employment history, and education. Before uploading, ask whether the file is stored, which providers receive it, how access is authorized, and how long copies remain.",
        ],
        checklist: [
          "Are files private by default?",
          "Are temporary download links short-lived?",
          "Is AI processing optional or clearly identified?",
          "Can I delete scans, resumes, and my account?",
          "Can I download my data first?",
        ],
      },
      {
        heading: "Read claims precisely",
        paragraphs: [
          "A privacy statement should match the implementation and provider settings. “Not used to train public models” is different from “never processed by a service provider.” Look for specific, configurable language.",
        ],
      },
      {
        heading: "Minimize before uploading",
        paragraphs: [
          "A resume analyzer rarely needs a street address, personal identifiers, references’ contact details, or sensitive demographic information. Remove data that is not necessary for the analysis or application.",
        ],
      },
    ],
  },
];

export const resourceBySlug = Object.fromEntries(
  resources.map((resource) => [resource.slug, resource]),
) as Record<ResourceSlug, Resource>;
