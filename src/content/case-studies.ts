export type CaseStudySlug =
  | "product-manager-platform-growth"
  | "software-engineer-developer-platform"
  | "marketing-manager-b2b-demand";

export interface CaseStudy {
  slug: CaseStudySlug;
  title: string;
  role: string;
  industry: string;
  seniority: string;
  problemSolved: string;
  summary: string;
  candidateContext: string;
  initialScore: number;
  improvedScore: number;
  problems: string[];
  changes: string[];
  beforeAfter: Array<{
    label: string;
    before: string;
    after: string;
    verification: string;
  }>;
  dimensions: Array<{
    label: string;
    before: number;
    after: number;
  }>;
  lessons: string[];
}

export const caseStudies: CaseStudy[] = [
  {
    slug: "product-manager-platform-growth",
    title: "Making platform leadership and business impact visible",
    role: "Product manager",
    industry: "Fintech / B2B SaaS",
    seniority: "Senior",
    problemSolved: "Impact evidence",
    summary:
      "A product leader’s resume had strong platform experience, but a dense skills table and responsibility-led bullets made the evidence difficult to scan.",
    candidateContext:
      "Alex is a fictional senior product manager with six years of experience across platform and growth work. This demonstration uses invented, non-identifying content.",
    initialScore: 61,
    improvedScore: 73,
    problems: [
      "The skills table created an uncertain reading order.",
      "Several bullets described ownership without an observable outcome.",
      "GTM strategy and revenue KPI evidence were difficult to locate.",
      "Two related skills appeared only as implicit language.",
    ],
    changes: [
      "Rebuilt skills as a plain single-column section.",
      "Connected two bullets to verified activation and delivery outcomes.",
      "Clarified GTM planning in an existing launch example.",
      "Moved role-specific tools into the experience where they were used.",
    ],
    beforeAfter: [
      {
        label: "Platform launch",
        before: "Worked with engineering and marketing on platform launches.",
        after:
          "Led roadmap delivery with engineering and partnered with GTM teams on three platform launches.",
        verification:
          "The fictional candidate confirmed launch count and leadership scope before applying the edit.",
      },
      {
        label: "Onboarding",
        before: "Responsible for improving the customer onboarding process.",
        after:
          "Prioritized onboarding experiments that improved activation from 42% to 49% over two quarters.",
        verification: "Both percentages are fictional demonstration data.",
      },
    ],
    dimensions: [
      { label: "Parseability", before: 58, after: 87 },
      { label: "Role match", before: 64, after: 73 },
      { label: "Experience", before: 74, after: 82 },
      { label: "Impact", before: 46, after: 62 },
      { label: "Formatting", before: 40, after: 76 },
      { label: "Readability", before: 71, after: 81 },
    ],
    lessons: [
      "Formatting repairs can make existing evidence easier to extract without changing the content.",
      "A truthful outcome often clarifies seniority more effectively than an extra adjective.",
      "Role language belongs beside evidence, not in a detached keyword block.",
    ],
  },
  {
    slug: "software-engineer-developer-platform",
    title: "Connecting technical depth to developer outcomes",
    role: "Software engineer",
    industry: "Developer tools",
    seniority: "Staff",
    problemSolved: "Role alignment",
    summary:
      "A staff-level engineer listed a broad toolset, but the resume did not clearly connect platform decisions to reliability, adoption, or developer velocity.",
    candidateContext:
      "Jordan is a fictional staff software engineer targeting developer-platform roles. All projects, metrics, and company details in this example are invented.",
    initialScore: 68,
    improvedScore: 82,
    problems: [
      "The summary emphasized years of experience rather than technical scope.",
      "Core platform requirements appeared as tool names without project evidence.",
      "Reliability improvements lacked a baseline and observable result.",
      "Leadership evidence was distributed across unrelated bullets.",
    ],
    changes: [
      "Reframed the summary around platform scope and engineering leadership.",
      "Linked Kubernetes and Terraform to a specific self-service environment project.",
      "Added a verified fictional change-failure-rate comparison.",
      "Consolidated mentorship and design-review evidence into a leadership bullet.",
    ],
    beforeAfter: [
      {
        label: "Developer platform",
        before: "Used Kubernetes, Terraform, and Go for internal infrastructure.",
        after:
          "Built a Go-based self-service deployment workflow on Kubernetes and Terraform, cutting median environment setup from two days to 35 minutes.",
        verification: "The timing and tool ownership are fictional demonstration data.",
      },
      {
        label: "Reliability",
        before: "Improved the reliability of deployment systems.",
        after:
          "Introduced canary checks and rollback automation, reducing the fictional change failure rate from 11% to 4%.",
        verification: "The metric is explicitly fictional and should not be reused as a personal claim.",
      },
    ],
    dimensions: [
      { label: "Parseability", before: 86, after: 91 },
      { label: "Role match", before: 59, after: 84 },
      { label: "Experience", before: 77, after: 88 },
      { label: "Impact", before: 52, after: 81 },
      { label: "Formatting", before: 73, after: 80 },
      { label: "Readability", before: 70, after: 78 },
    ],
    lessons: [
      "Tool names become credible role signals when they are tied to an engineering decision and outcome.",
      "Staff-level evidence should reveal leverage across systems and teams, not just task complexity.",
      "A small set of verified operational metrics can replace broad performance claims.",
    ],
  },
  {
    slug: "marketing-manager-b2b-demand",
    title: "Replacing channel activity with pipeline evidence",
    role: "Marketing manager",
    industry: "B2B SaaS",
    seniority: "Manager",
    problemSolved: "Achievement clarity",
    summary:
      "A demand-generation resume documented a busy campaign calendar but made channel ownership, pipeline influence, and sales alignment hard to evaluate.",
    candidateContext:
      "Samira is a fictional marketing manager targeting B2B demand-generation roles. Campaigns, budgets, metrics, and employers are demonstration content.",
    initialScore: 64,
    improvedScore: 79,
    problems: [
      "Six bullets opened with low-ownership phrases.",
      "Campaign volume appeared without audience, budget, or funnel context.",
      "The target description emphasized pipeline, attribution, and sales alignment.",
      "The summary repeated channel names without a clear positioning statement.",
    ],
    changes: [
      "Rewrote activity-led bullets around decisions and funnel outcomes.",
      "Added verified fictional budget, audience, and pipeline scope.",
      "Placed attribution and sales-alignment language beside an actual campaign example.",
      "Removed repeated tool names from the summary.",
    ],
    beforeAfter: [
      {
        label: "Integrated campaign",
        before: "Helped with webinars, paid social, and email campaigns.",
        after:
          "Owned an integrated webinar, paid social, and lifecycle program that generated $1.2M in fictional sourced pipeline across two quarters.",
        verification: "The ownership and pipeline number are fictional demonstration data.",
      },
      {
        label: "Sales alignment",
        before: "Worked closely with sales to improve leads.",
        after:
          "Partnered with sales operations to refine MQL routing, raising fictional accepted-lead rate from 54% to 67%.",
        verification: "The accepted-lead figures are fictional demonstration data.",
      },
    ],
    dimensions: [
      { label: "Parseability", before: 83, after: 88 },
      { label: "Role match", before: 57, after: 80 },
      { label: "Experience", before: 69, after: 81 },
      { label: "Impact", before: 44, after: 78 },
      { label: "Formatting", before: 72, after: 79 },
      { label: "Readability", before: 74, after: 80 },
    ],
    lessons: [
      "Channel activity is more useful when the audience, decision, and funnel outcome are explicit.",
      "Sales alignment should be demonstrated through a shared process or measure.",
      "Removing repeated tools can make room for positioning and scope.",
    ],
  },
];

export const caseStudyBySlug = Object.fromEntries(
  caseStudies.map((study) => [study.slug, study]),
) as Record<CaseStudySlug, CaseStudy>;

