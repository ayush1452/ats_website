export type PlanId = "free" | "pro" | "career" | "teams";

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  scans: number;
  resumes: number | "unlimited";
  seats: number;
  recommended?: boolean;
  features: string[];
}

export const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Understand the highest-impact issues in one resume.",
    monthlyPrice: 0,
    annualPrice: 0,
    scans: 3,
    resumes: 1,
    seats: 1,
    features: [
      "Basic ATS and format findings",
      "One saved resume",
      "30-day report history",
      "Sample comparison report",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Tailor applications with complete evidence and keyword analysis.",
    monthlyPrice: 19,
    annualPrice: 190,
    scans: 30,
    resumes: 10,
    seats: 1,
    recommended: true,
    features: [
      "Complete job-match analysis",
      "AI-assisted rewrites",
      "Version comparison",
      "PDF exports",
    ],
  },
  {
    id: "career",
    name: "Career Plus",
    description: "Run a focused search across several role targets.",
    monthlyPrice: 39,
    annualPrice: 390,
    scans: 100,
    resumes: "unlimited",
    seats: 1,
    features: [
      "Multiple role targets",
      "Advanced progress tracking",
      "Complete scan history",
      "Priority analysis queue",
    ],
  },
  {
    id: "teams",
    name: "Teams & Coaches",
    description: "Review candidates together with permissions and shared reporting.",
    monthlyPrice: 99,
    annualPrice: 990,
    scans: 250,
    resumes: "unlimited",
    seats: 5,
    features: [
      "Five included seats",
      "Shared candidate workspace",
      "Comments and permissions",
      "Central billing",
    ],
  },
];
