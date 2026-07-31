import { productConfig } from "@/config/product";
import { scoringWeights } from "@/config/scoring";
import { detectSections } from "@/lib/analysis/text";
import type {
  AnalysisInput,
  AnalysisResult,
  CanonicalResumeDocument,
  Finding,
  KeywordMatch,
  ResumeAnnotation,
  ResumeVersion,
  ScanSummary,
} from "@/types/domain";

export const DEMO_SCAN_ID = "alex-morgan-product-lead";
export const DEMO_RESUME_ID = "alex-morgan-resume";

export const demoResumeText = `ALEX MORGAN
alex.morgan@example.com · +1 (555) 014-0198 · Austin, TX

SUMMARY
Senior product manager with 6 years of experience building platform and growth products for fintech and B2B SaaS teams. Data-driven partner to engineering, design, and go-to-market stakeholders.

EXPERIENCE
Senior Product Manager | Northstar Ledger | Jan 2022 – Present
• Led the product roadmap for API onboarding, increasing activated accounts by 24% in two quarters.
• Established quarterly OKRs with cross-functional engineering, sales, and customer-success leaders.
• Designed A/B testing and user research programs that improved trial-to-paid conversion by 11%.
• Responsible for coordinating launch planning with sales and marketing stakeholders.
• Used Mixpanel and SQL analysis to prioritize friction points across the customer journey.

Product Manager | Harborline Systems | Mar 2019 – Dec 2021
• Managed Agile discovery and delivery for a B2B SaaS workflow used by 18,000 operations users.
• Helped the team build partner API capabilities and maintained delivery plans in Jira.
• Facilitated customer interviews and translated findings into Figma prototypes.

SKILLS
Product Roadmap | Agile | OKRs | Stakeholders
Cross-functional Leadership | B2B SaaS | A/B Testing | User Research
API Products | Data-driven Decisions | Jira | Figma | Mixpanel | Python | SQL

EDUCATION
B.S. Business Analytics, Western Lakes University, 2018

CERTIFICATIONS
Certified Scrum Product Owner (CSPO), 2021`;

const sections = detectSections(demoResumeText);

export const demoDocument: CanonicalResumeDocument = {
  version: 1,
  filename: "alex-morgan-resume.pdf",
  fileType: "pdf",
  pageCount: 2,
  normalizedText: demoResumeText,
  spans: [
    {
      id: "alex-page-1",
      page: 1,
      text: demoResumeText.slice(0, 860),
      start: 0,
      end: 860,
    },
    {
      id: "alex-page-2",
      page: 2,
      text: demoResumeText.slice(860),
      start: 860,
      end: demoResumeText.length,
    },
  ],
  sections,
  layoutSignals: [
    {
      type: "table",
      page: 2,
      confidence: 0.91,
      detail: "The skills block is laid out as a two-column table in the source PDF.",
    },
  ],
  extractionConfidence: 0.94,
};

export const demoJobDescription = `Senior Product Manager — Platform & Growth

Lead the product roadmap for a fintech platform serving B2B SaaS customers. Partner with engineering, design, data, sales, and marketing on GTM strategy, API products, and measurable revenue KPIs. Define OKRs, run user research and A/B testing, and use SQL, Tableau, Mixpanel, Jira, and Figma to guide data-driven decisions. Candidates should be comfortable with competitive analysis and communicating with cross-functional stakeholders. Python experience is preferred.`;

export const demoAnalysisInput: AnalysisInput = {
  document: demoDocument,
  jobDescription: demoJobDescription,
  jobTitle: "Senior Product Manager — Platform & Growth",
  company: "Clearwater Financial",
  targetRole: "Senior Product Manager — Platform & Growth",
  seniority: "Senior",
  industry: "Fintech / B2B SaaS",
  market: "United States",
  goal: "match",
};

const matchedTerms = [
  "Product Roadmap",
  "Agile",
  "OKRs",
  "Stakeholders",
  "Cross-functional",
  "B2B SaaS",
  "A/B Testing",
  "User Research",
  "API",
  "Data-driven",
  "Jira",
  "Figma",
  "Mixpanel",
] as const;
const partialTerms = ["Python", "SQL"] as const;
const missingTerms = [
  "Tableau",
  "GTM Strategy",
  "Revenue KPIs",
  "Competitive Analysis",
] as const;

function keyword(
  term: string,
  status: KeywordMatch["status"],
  index: number,
): KeywordMatch {
  const resumeFrequency =
    status === "missing"
      ? 0
      : term === "Stakeholders" || term === "API"
        ? 2
        : 1;
  return {
    keyword: term,
    status,
    group:
      ["Tableau", "Mixpanel", "Jira", "Figma", "Python", "SQL"].includes(term)
        ? "Tools & technology"
        : ["GTM Strategy", "Product Roadmap", "OKRs", "Revenue KPIs"].includes(term)
          ? "Strategy & outcomes"
          : "Role signals",
    requirementType: index < 10 ? "must-have" : index < 17 ? "preferred" : "context",
    importance: Math.max(3.5, 9.5 - index * 0.3),
    resumeFrequency,
    jobFrequency: index < 8 ? 2 : 1,
    scoreImpact: status === "missing" ? Math.max(2, 5 - (index - 15) * 0.7) : 0,
    recommendedSection:
      status === "missing"
        ? term === "Tableau"
          ? "Skills"
          : "Experience"
        : undefined,
    evidence:
      resumeFrequency > 0
        ? `Explicit evidence appears in the ${["Jira", "Figma", "Mixpanel", "Python", "SQL"].includes(term) ? "skills or experience" : "summary or experience"} section.`
        : undefined,
  };
}

const demoKeywords: KeywordMatch[] = [
  ...matchedTerms.map((term, index) => keyword(term, "matched", index)),
  ...partialTerms.map((term, index) => keyword(term, "partial", index + matchedTerms.length)),
  ...missingTerms.map((term, index) =>
    keyword(term, "missing", index + matchedTerms.length + partialTerms.length),
  ),
];

const responsibilityBullet =
  "• Responsible for coordinating launch planning with sales and marketing stakeholders.";
const weakBullet =
  "• Helped the team build partner API capabilities and maintained delivery plans in Jira.";
const skillsBlock =
  "Product Roadmap | Agile | OKRs | Stakeholders\nCross-functional Leadership | B2B SaaS | A/B Testing | User Research\nAPI Products | Data-driven Decisions | Jira | Figma | Mixpanel | Python | SQL";

const sourceRange = (source: string): Pick<Finding, "sourceStart" | "sourceEnd"> => {
  const sourceStart = demoResumeText.indexOf(source);
  if (sourceStart < 0) {
    throw new Error(`Demo source text is missing: ${source}`);
  }
  return { sourceStart, sourceEnd: sourceStart + source.length };
};

const demoFindings: Finding[] = [
  {
    id: "demo-format-skills-table",
    category: "format",
    severity: "high",
    title: "Skills table may change extraction order",
    description:
      "A table is used in the skills section and may disrupt text extraction.",
    whyItMatters:
      "Some document parsers flatten table cells in an unexpected order, which can separate a skill from its context.",
    recommendation:
      "Replace the skills table with a plain single-column section.",
    sourceText: skillsBlock,
    sourceSection: "Skills",
    ...sourceRange(skillsBlock),
    scoreImpact: 9,
    effort: "medium",
    status: "open",
  },
  {
    id: "demo-impact-outcomes",
    category: "impact",
    severity: "high",
    title: "Responsibility statement lacks an outcome",
    description:
      "Several bullets describe responsibility but do not state measurable outcomes.",
    whyItMatters:
      "Scope and verified outcomes make product leadership contributions easier to evaluate.",
    recommendation:
      "Add truthful revenue, adoption, efficiency, or business-outcome evidence.",
    sourceText: responsibilityBullet,
    sourceSection: "Experience",
    ...sourceRange(responsibilityBullet),
    scoreImpact: 7,
    effort: "medium",
    status: "open",
    requiresVerification: true,
  },
  {
    id: "demo-gap-gtm",
    category: "job-match",
    severity: "high",
    title: "GTM strategy evidence is missing",
    description:
      "The target role emphasizes GTM strategy, but no explicit supporting evidence was detected.",
    whyItMatters:
      "The term is a high-weight requirement in the supplied job description.",
    recommendation:
      "Add GTM strategy evidence where applicable and connect it to a verified launch outcome.",
    scoreImpact: 5,
    effort: "medium",
    status: "open",
    requiresVerification: true,
  },
  {
    id: "demo-impact-weak-verb",
    category: "experience",
    severity: "medium",
    title: "Weak opening verb obscures ownership",
    description:
      "“Helped” does not clarify Alex’s specific decision or contribution.",
    whyItMatters:
      "Precise ownership language helps reviewers distinguish leadership from participation.",
    recommendation:
      "Strengthen this bullet with the specific action Alex owned and its verified result.",
    sourceText: weakBullet,
    sourceSection: "Experience",
    ...sourceRange(weakBullet),
    scoreImpact: 4,
    effort: "low",
    status: "open",
    requiresVerification: true,
  },
  {
    id: "demo-gap-tableau",
    category: "keywords",
    severity: "medium",
    title: "Tableau is a weighted gap",
    description:
      "Tableau appears in the job description but was not found in the resume.",
    whyItMatters:
      "Explicit tool evidence can improve clarity when the candidate has genuine experience.",
    recommendation:
      "Include Tableau only when the candidate has actual experience.",
    scoreImpact: 3,
    effort: "low",
    status: "open",
    requiresVerification: true,
  },
  {
    id: "demo-pass-contact",
    category: "format",
    severity: "passed",
    title: "Contact information parses cleanly",
    description: "A fictional email, phone number, and location were detected in a simple text line.",
    whyItMatters: "Clear contact fields reduce ambiguity during text extraction.",
    recommendation: "Keep this contact line as plain text.",
    scoreImpact: 0,
    effort: "low",
    status: "resolved",
  },
];

const pageAt = (offset: number) => (offset >= 860 ? 2 : 1);

const demoAnnotations: ResumeAnnotation[] = demoFindings.flatMap((finding, index) => {
  if (
    finding.sourceStart === undefined ||
    finding.sourceEnd === undefined ||
    !finding.sourceText
  ) {
    return [];
  }
  return [
    {
      id: `demo-annotation-${index + 1}`,
      findingId: finding.id,
      start: finding.sourceStart,
      end: finding.sourceEnd,
      page: pageAt(finding.sourceStart),
      status: finding.severity,
      label: finding.title,
    },
  ];
});

export const demoResult: AnalysisResult = {
  schemaVersion: 1,
  analyzerVersion: "1.0.0-demo",
  mode: "demo",
  overallScore: 73,
  confidence: 0.91,
  completedAt: "2026-07-18T14:30:00.000Z",
  componentScores: {
    atsParse: 87,
    recruiterClarity: 72,
    roleMatch: 73,
  },
  dimensionScores: [
    {
      key: "experience",
      label: "Work Experience",
      score: 82,
      explanation: "Relevant product leadership and platform scope are explicit.",
    },
    {
      key: "alignment",
      label: "Skills Match",
      score: 78,
      explanation: "Most core terms are present, with four weighted gaps.",
    },
    {
      key: "education",
      label: "Education",
      score: 70,
      explanation: "Education is clear and concise for this role.",
    },
    {
      key: "impact",
      label: "Achievements",
      score: 55,
      explanation: "Three bullets include outcomes; several still describe responsibility.",
    },
    {
      key: "formatting",
      label: "Formatting",
      score: 40,
      explanation: "A skills table creates a meaningful extraction-order risk.",
    },
    {
      key: "certifications",
      label: "Certifications",
      score: 60,
      explanation: "One relevant product certification is present.",
    },
    {
      key: "readability",
      label: "Readability",
      score: 81,
      explanation: "Equivalent to 8.1/10 in the product’s clarity view.",
    },
  ],
  metrics: {
    keywordMatch: 78,
    impact: 62,
    readability: 81,
    achievementDensity: 43,
    requirementCoverage: 74,
    formatRisk: 60,
  },
  keywords: demoKeywords,
  sections: [
    {
      name: "Summary",
      status: "detected",
      confidence: 0.98,
      order: 0,
      length: 196,
      relevance: 84,
      readability: 83,
      action: "Add the target platform-and-growth scope in one concise line.",
    },
    {
      name: "Experience",
      status: "detected",
      confidence: 0.99,
      order: 1,
      length: 770,
      relevance: 88,
      readability: 80,
      issue: "Two bullets do not show ownership or measurable outcomes.",
      action: "Strengthen the two responsibility-only bullets with verified evidence.",
    },
    {
      name: "Skills",
      status: "warning",
      confidence: 0.95,
      order: 2,
      length: 188,
      relevance: 78,
      readability: 74,
      issue: "The source document uses a table for this section.",
      action: "Convert the table to a plain single-column skills list.",
    },
    {
      name: "Education",
      status: "detected",
      confidence: 0.98,
      order: 3,
      length: 61,
      relevance: 70,
      readability: 91,
      action: "No change is required.",
    },
    {
      name: "Certifications",
      status: "detected",
      confidence: 0.97,
      order: 4,
      length: 54,
      relevance: 60,
      readability: 90,
      action: "Keep the credential if it remains current.",
    },
  ],
  requirements: [
    {
      requirement: "Lead a B2B SaaS product roadmap",
      type: "must-have",
      importance: 9.5,
      status: "strong",
      evidence: "Led the product roadmap for API onboarding.",
      evidenceLocation: "Northstar Ledger experience",
      score: 100,
      explanation: "Direct leadership and platform evidence are present.",
      action: "Keep the quantified activation result.",
    },
    {
      requirement: "GTM strategy",
      type: "must-have",
      importance: 9,
      status: "missing",
      score: 0,
      explanation: "Launch coordination appears, but strategic GTM ownership is not explicit.",
      action: "Add evidence only if Alex owned a truthful part of GTM strategy.",
    },
    {
      requirement: "Revenue KPI ownership",
      type: "must-have",
      importance: 8.7,
      status: "missing",
      score: 0,
      explanation: "Conversion is quantified, but revenue KPI ownership is not explicit.",
      action: "Name the verified revenue KPI only if Alex influenced or owned it.",
    },
    {
      requirement: "SQL and analytics",
      type: "preferred",
      importance: 7.8,
      status: "partial",
      evidence: "Used Mixpanel and SQL analysis to prioritize friction points.",
      evidenceLocation: "Northstar Ledger experience",
      score: 65,
      explanation: "The tool is named, but depth and decision scope are limited.",
      action: "Clarify the analysis performed and the decision it informed.",
    },
    {
      requirement: "Tableau",
      type: "preferred",
      importance: 6.5,
      status: "missing",
      score: 0,
      explanation: "No Tableau evidence was detected.",
      action: "Include Tableau only if it reflects real experience.",
    },
  ],
  findings: demoFindings,
  recommendations: [
    {
      id: "demo-rewrite-launch",
      findingId: "demo-impact-outcomes",
      title: "Clarify launch ownership and outcome",
      originalText: responsibilityBullet,
      suggestedText:
        "Led cross-functional launch planning with sales and marketing, contributing to [verified adoption or revenue outcome].",
      rationale:
        "The revision makes ownership clearer while leaving the business result as a fact-checkable placeholder.",
      changes: ["Replaces passive responsibility language", "Names collaborators", "Prompts for verified evidence"],
      requiresVerification: true,
      status: "pending",
    },
    {
      id: "demo-rewrite-partner-api",
      findingId: "demo-impact-weak-verb",
      title: "Specify the partner API contribution",
      originalText: weakBullet,
      suggestedText:
        "Defined [verified product contribution] for partner API capabilities and maintained delivery plans in Jira, enabling [verified outcome].",
      rationale:
        "The suggestion avoids inventing ownership and asks Alex to supply the accurate contribution and result.",
      changes: ["Removes “Helped”", "Requests specific ownership", "Adds an outcome prompt"],
      requiresVerification: true,
      status: "pending",
    },
  ],
  annotations: demoAnnotations,
  benchmark: {
    label: "Curated strong-resume target",
    score: 85,
    explanation:
      `An illustrative target selected by ${productConfig.name} for product context. It is not based on a proprietary dataset or a guarantee of hiring outcomes.`,
  },
  scoreTrend: [
    { label: "Original", score: 61 },
    { label: "Structure pass", score: 67 },
    { label: "Current", score: 73 },
  ],
  weightSnapshot: { ...scoringWeights },
};

const originalResumeText = demoResumeText
  .replace(
    "• Led the product roadmap for API onboarding, increasing activated accounts by 24% in two quarters.",
    "• Responsible for the API onboarding product roadmap.",
  )
  .replace(
    "• Designed A/B testing and user research programs that improved trial-to-paid conversion by 11%.",
    "• Worked on experiments and customer research.",
  );

export const demoVersions: ResumeVersion[] = [
  {
    id: "alex-morgan-v1",
    version: 1,
    name: "Original upload",
    content: originalResumeText,
    source: "upload",
    changeSummary: "Initial uploaded resume",
    createdAt: "2026-06-28T09:15:00.000Z",
    score: 61,
  },
  {
    id: "alex-morgan-v2",
    version: 2,
    name: "Platform & growth revision",
    content: demoResumeText,
    source: "rewrite",
    changeSummary: "Clarified product scope and added two verified outcomes",
    createdAt: "2026-07-18T14:12:00.000Z",
    score: 73,
  },
];

export const demoScans: ScanSummary[] = [
  {
    id: DEMO_SCAN_ID,
    resumeName: "Alex Morgan — Platform & Growth",
    targetRole: "Senior Product Manager — Platform & Growth",
    company: "Clearwater Financial",
    createdAt: "2026-07-18T14:30:00.000Z",
    overallScore: 73,
    roleMatch: 73,
    atsParse: 87,
    status: "complete",
    mode: "demo",
  },
  {
    id: "alex-morgan-b2b-platform",
    resumeName: "Alex Morgan — Platform",
    targetRole: "Senior Platform Product Manager",
    company: "Orbit Commerce",
    createdAt: "2026-07-09T10:20:00.000Z",
    overallScore: 67,
    roleMatch: 69,
    atsParse: 82,
    status: "complete",
    mode: "demo",
  },
  {
    id: "alex-morgan-original",
    resumeName: "Alex Morgan — Original",
    targetRole: "Product Manager",
    createdAt: "2026-06-28T09:30:00.000Z",
    overallScore: 61,
    roleMatch: 58,
    atsParse: 78,
    status: "complete",
    mode: "demo",
  },
];
