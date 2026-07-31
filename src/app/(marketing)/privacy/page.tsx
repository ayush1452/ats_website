import type { Metadata } from "next";

import { LegalDocument } from "@/components/marketing/legal-document";
import { productConfig } from "@/config/product";
import { privacySections } from "@/content/legal";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    `How ${productConfig.name} is designed to process resume data, account information, analysis results, sharing, retention, and deletion.`,
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: `${productConfig.name} privacy policy`,
    description: "Plain-language information about resume data and user controls.",
    url: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      description={`How ${productConfig.name} is designed to handle resume content, job descriptions, account information, analysis results, live sharing, provider processing, retention, and user controls.`}
      effectiveDate="July 23, 2026"
      sections={privacySections}
      title="Privacy policy"
    />
  );
}
