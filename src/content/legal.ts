import { productConfig } from "@/config/product";

export interface LegalSection {
  id: string;
  title: string;
  paragraphs: string[];
  items?: string[];
}

export const privacySections: LegalSection[] = [
  {
    id: "scope",
    title: "1. Scope and operating modes",
    paragraphs: [
      `This policy explains how ${productConfig.name} is designed to handle information when you use its website, demo analysis, live account features, reports, and team workspaces. The production operator and provider list must be confirmed before public launch.`,
      "Demo mode stores the sample session, draft, and deterministic results in your browser. Live mode uses configured service providers for authentication, database storage, private file storage, optional semantic analysis, email, billing, and abuse prevention.",
    ],
  },
  {
    id: "data",
    title: "2. Information processed",
    paragraphs: [
      `Depending on the features you use, ${productConfig.name} may process account details, profile preferences, resume files and pasted text, job descriptions, target-role context, analysis results, saved versions, report comments, team membership, support messages, subscription records, and basic security events.`,
      "Resumes can contain personal information about you and other people. Remove street addresses, government identifiers, references’ contact details, sensitive demographic information, and anything the analysis does not need.",
    ],
    items: [
      "Account data: email, display name, role preferences, and authentication events.",
      "Workspace data: resumes, versions, job descriptions, scans, findings, exports, shares, and comments.",
      "Technical data: coarse request metadata, rate-limit records, and sanitized error information.",
      "Billing data: plan and subscription status; full payment-card details stay with the configured payment provider.",
    ],
  },
  {
    id: "purpose",
    title: "3. Why information is used",
    paragraphs: [
      "Information is used to provide and secure the requested service: authenticate users, extract supported document content, run analysis, save version history, enforce limits, create exports or private shares, support team permissions, answer messages, and maintain reliability.",
      "Resume content, job descriptions, names, emails, prompts, signed URLs, and provider responses are excluded from routine application logs by design.",
    ],
  },
  {
    id: "ai",
    title: "4. Automated and AI-assisted processing",
    paragraphs: [
      "Deterministic checks handle suitable tasks such as section detection, keyword frequency, bullet structure, date consistency, readability, and supported layout signals. A configured server-side AI provider may assist with semantic requirement classification, related-skill evidence, explanations, or rewrite suggestions.",
      "Live deployments must verify provider retention and training settings before using the statement that resumes are not used to train public models. Demo analysis does not send resume content to an external AI provider.",
    ],
  },
  {
    id: "storage",
    title: "5. Storage, access, and sharing",
    paragraphs: [
      "Live resume and report files are designed for private storage with opaque paths. Downloads use short-lived signed links, and database access is checked against the user and authorized team membership.",
      "A report is not externally accessible unless you deliberately create a live share link. Live share links use high-entropy tokens, expire by default after seven days, and can be revoked. Demo mode cannot create an externally accessible share link without a configured backend.",
    ],
  },
  {
    id: "retention",
    title: "6. Retention and your controls",
    paragraphs: [
      "Live account settings are designed to let you export account data, choose available retention preferences, delete scans or resumes, revoke report shares, and delete the account. Storage objects are removed before related database records are hard-deleted where the workflow requires it.",
      "Some limited records may be retained when necessary for security, fraud prevention, legal compliance, or resolving a transaction. The final production schedule must reflect the configured providers and applicable law.",
    ],
  },
  {
    id: "security",
    title: "7. Security",
    paragraphs: [
      `${productConfig.name} is designed with server-side authorization, row-level database policies, private storage, input and file validation, rate limits, origin checks, content-security headers, sanitized errors, and secret keys kept out of client bundles.`,
      "No online service can promise absolute security. Report a suspected vulnerability through the contact form with the Privacy and data topic; do not include a real resume or secret in the message.",
    ],
  },
  {
    id: "rights",
    title: "8. Privacy rights and international use",
    paragraphs: [
      "Depending on your location, you may have rights to access, correct, delete, restrict, object to, or obtain a copy of personal information. Use account controls when available or submit a privacy request through the contact form.",
      "The production operator must publish its legal identity, processing locations, transfer safeguards, and jurisdiction-specific disclosures before launch.",
    ],
  },
  {
    id: "children",
    title: "9. Children",
    paragraphs: [
      `${productConfig.name} is not directed to children under 16, and users should not upload a child’s personal information without a lawful basis and appropriate authorization.`,
    ],
  },
  {
    id: "changes",
    title: "10. Changes and contact",
    paragraphs: [
      `Material policy changes should be presented with an updated effective date and, where required, account notice. Questions and privacy requests can be sent through the ${productConfig.name} contact form.`,
    ],
  },
];

export const termsSections: LegalSection[] = [
  {
    id: "agreement",
    title: "1. Agreement and eligibility",
    paragraphs: [
      `These terms govern use of the ${productConfig.name} website, demo experience, live account, reports, exports, shares, and team features. They are a product-ready template that must be reviewed and completed with the production operator’s legal identity and jurisdiction before launch.`,
      `You must be at least 16 and able to form a binding agreement in your location. If you use ${productConfig.name} for an organization, you confirm that you are authorized to accept these terms for it.`,
    ],
  },
  {
    id: "service",
    title: "2. The service and analysis limits",
    paragraphs: [
      `${productConfig.name} provides document extraction, supported formatting checks, configurable heuristic scores, job-description evidence mapping, recommendations, optional AI-assisted suggestions, version comparison, and reporting tools.`,
      `${productConfig.name} does not represent that it emulates, integrates with, or has tested every third-party applicant tracking system. Scores, benchmarks, potential gains, and recommendations are informational product heuristics—not guarantees of ATS acceptance, interviews, hiring, compensation, or employment.`,
    ],
  },
  {
    id: "accounts",
    title: "3. Accounts and security",
    paragraphs: [
      `You are responsible for accurate account information, safeguarding access, and activity under your account. Notify ${productConfig.name} promptly if you suspect unauthorized access.`,
      "Team owners and administrators control membership and workspace access. Coaches, members, and viewers receive the permissions shown in the product. Do not invite someone to access candidate data unless you are authorized to share it.",
    ],
  },
  {
    id: "content",
    title: "4. Your content and responsibilities",
    paragraphs: [
      "You retain ownership of the resumes, job descriptions, edits, and other content you provide. You grant the production operator a limited license to process that content only as needed to provide, secure, and support the service.",
      "You must have the right to upload and share the content. You are responsible for verifying every factual claim, metric, skill, title, and outcome before using a recommendation. Do not upload unnecessary sensitive data or another person’s resume without permission.",
    ],
  },
  {
    id: "acceptable-use",
    title: "5. Acceptable use",
    paragraphs: [`You may not misuse ${productConfig.name} or help another person do so.`],
    items: [
      "Do not upload malware, encrypted attacks, deceptive archives, or files intended to exhaust processing resources.",
      "Do not bypass access controls, rate limits, quotas, subscriptions, or team permissions.",
      "Do not scrape the service, probe other accounts, reverse engineer protected systems, or interfere with availability.",
      "Do not use suggestions to fabricate qualifications, experience, outcomes, identities, or application materials.",
      "Do not use the service in violation of law or another person’s privacy, confidentiality, or intellectual-property rights.",
    ],
  },
  {
    id: "ai",
    title: "6. AI-assisted suggestions",
    paragraphs: [
      `AI-assisted output may be incomplete, inaccurate, or unsuitable. Suggestions stay optional and require your review. Applying a suggestion does not transfer responsibility for its truthfulness to ${productConfig.name}.`,
      "When no live provider is configured, deterministic sample suggestions are labeled “Demo analysis.” The product must not represent a sample output as a live external model result.",
    ],
  },
  {
    id: "plans",
    title: "7. Plans, usage, and billing",
    paragraphs: [
      "Plan names, limits, monthly prices, and annual totals are displayed before checkout. A configured payment provider handles charges, payment methods, invoices, taxes, and applicable renewals. Demo mode does not create real charges or invoices.",
      "A completed analysis of one resume version counts as a scan. Opening, exporting, sharing, or comparing an existing report does not. Plan changes and cancellation take effect as shown in the configured billing flow and as required by law.",
    ],
  },
  {
    id: "ownership",
    title: `8. ${productConfig.name} materials`,
    paragraphs: [
      `The service, software, visual system, documentation, and original content are protected by applicable intellectual-property laws. These terms do not grant rights to the ${productConfig.name} name, marks, or software except the limited right to use the service as intended.`,
    ],
  },
  {
    id: "termination",
    title: "9. Suspension and termination",
    paragraphs: [
      "You may stop using the service and use available account deletion controls. Access may be limited or suspended when reasonably necessary to address security risk, unlawful use, nonpayment, material breach, or harm to the service or other users.",
      "Where practical, the operator should provide notice and a chance to export data before non-urgent termination. Some terms remain effective where their nature requires it, including ownership, disclaimers, and liability limits.",
    ],
  },
  {
    id: "disclaimer",
    title: "10. Disclaimers and liability",
    paragraphs: [
      `The service is provided on an “as available” basis to the extent permitted by law. Resume analysis depends on source-document quality, user context, configured providers, and systems outside ${productConfig.name}’s control.`,
      "The production terms must include jurisdiction-appropriate warranty disclaimers, liability limits, consumer protections, dispute process, governing law, and operator details. Nothing in this template excludes rights or liabilities that cannot legally be excluded.",
    ],
  },
  {
    id: "changes",
    title: "11. Changes and contact",
    paragraphs: [
      "Material changes should be communicated with an updated effective date and any notice required by law. Questions about these terms can be submitted through the contact form.",
    ],
  },
];
