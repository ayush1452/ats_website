import { productConfig } from "@/config/product";

export interface FaqItem {
  category: "Product" | "Scoring" | "Privacy" | "Plans";
  question: string;
  answer: string;
}

export const siteNavigation = [
  { label: "Features", href: "/features" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Case studies", href: "/case-studies" },
  { label: "Resources", href: "/resources" },
] as const;

export const workflowSteps = [
  {
    number: "01",
    title: "Add the source",
    description:
      "Upload a supported resume or paste the text. Add a job description when role-specific analysis matters.",
  },
  {
    number: "02",
    title: "Inspect the evidence",
    description:
      `${productConfig.name} checks extraction, structure, role language, experience, impact, formatting, and readability.`,
  },
  {
    number: "03",
    title: "Open each finding",
    description:
      "See what was detected, why it matters, where it appears, and the practical repair.",
  },
  {
    number: "04",
    title: "Compare the revision",
    description:
      "Save a new version, rescan it, and review score, evidence, keyword, and issue changes together.",
  },
] as const;

export const faqs: FaqItem[] = [
  {
    category: "Product",
    question: `What does ${productConfig.name} analyze?`,
    answer:
      "It examines supported signals for text extraction, section structure, experience evidence, achievements, formatting, readability, keywords, and job-description alignment. Each result links back to an explanation and source evidence where available.",
  },
  {
    category: "Product",
    question: "Which file types are supported?",
    answer:
      "PDF, DOCX, and TXT files up to 8 MiB are supported. Image-only scans and encrypted documents require a text-based copy because OCR is outside the current version.",
  },
  {
    category: "Product",
    question: "Can I scan without a job description?",
    answer:
      `Yes. ${productConfig.name} still checks parseability, experience, impact, formatting, and readability. Role-match and keyword-alignment metrics are marked unavailable rather than counted as zero.`,
  },
  {
    category: "Product",
    question: `Does ${productConfig.name} integrate with every ATS?`,
    answer:
      "No. It uses documented parsing techniques and product heuristics to surface supported risks. It does not claim to emulate or have tested every employer’s third-party system.",
  },
  {
    category: "Scoring",
    question: "Is the score a prediction of getting an interview?",
    answer:
      `No. The score is a transparent product heuristic for the evidence ${productConfig.name} can inspect. It cannot guarantee ATS acceptance, interviews, or employment.`,
  },
  {
    category: "Scoring",
    question: "How is the overall score calculated?",
    answer:
      "The configurable model weights parseability at 20%, job and keyword alignment at 25%, experience evidence at 20%, measurable impact at 15%, structure and formatting at 10%, and readability at 10%. Without a job description, the remaining dimensions are proportionally normalized.",
  },
  {
    category: "Scoring",
    question: "Where do benchmark numbers come from?",
    answer:
      `Any benchmark shown in the product is labeled as a curated illustrative target. ${productConfig.name} does not claim a proprietary dataset of millions of resumes.`,
  },
  {
    category: "Privacy",
    question: "Is my resume used to train public AI models?",
    answer: productConfig.privacy.noTrainingVerified
      ? `${productConfig.name}’s configured provider policy says resumes are not used to train public models. Demo analysis remains in your browser.`
      : `${productConfig.privacy.uploadAssurance} Demo analysis remains in your browser, and a live deployment must verify its provider settings before making a no-training claim.`,
  },
  {
    category: "Privacy",
    question: "Can I delete my data?",
    answer:
      "Live accounts include controls to delete scans and resumes, export account data, choose retention preferences, and delete the account. Demo-mode browser data can be cleared from settings.",
  },
  {
    category: "Privacy",
    question: "Can other people see a shared report?",
    answer:
      "Live share links are private, revocable, high-entropy URLs with an expiry. Demo mode cannot create an externally accessible share link without a configured backend.",
  },
  {
    category: "Plans",
    question: "Can I change plans later?",
    answer:
      "Yes. A configured billing deployment supports plan changes from billing settings. If billing is not configured, the interface clearly says checkout is unavailable and does not invent a transaction.",
  },
  {
    category: "Plans",
    question: "What counts as a scan?",
    answer:
      "A completed analysis of one resume version counts as one scan. Opening an existing report, exporting it, or comparing saved versions does not create another scan.",
  },
  {
    category: "Plans",
    question: "Is Teams & Coaches only for recruiting teams?",
    answer:
      "No. It is also designed for independent coaches and university career teams that need shared candidate workspaces, comments, permissions, and central billing.",
  },
];

export const footerGroups = [
  {
    label: "Product",
    links: [
      { label: "Overview", href: "/" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Pricing", href: "/pricing" },
      { label: "Scan a resume", href: "/scan" },
    ],
  },
  {
    label: "Features",
    links: [
      { label: "ATS parser", href: "/features/ats-parser" },
      { label: "Job match", href: "/features/job-match" },
      { label: "Keyword analysis", href: "/features/keyword-analysis" },
      { label: "Impact analysis", href: "/features/impact-analysis" },
      { label: "AI rewrite", href: "/features/ai-rewrite" },
      { label: "Version comparison", href: "/features/version-comparison" },
    ],
  },
  {
    label: "Resources",
    links: [
      { label: "Guides", href: "/resources" },
      { label: "Case studies", href: "/case-studies" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    label: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    label: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
] as const;
