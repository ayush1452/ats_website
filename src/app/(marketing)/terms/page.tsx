import type { Metadata } from "next";

import { LegalDocument } from "@/components/marketing/legal-document";
import { productConfig } from "@/config/product";
import { termsSections } from "@/content/legal";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    `Terms for using ${productConfig.name}’s website, demo and live analysis, reports, suggestions, plans, and team workspaces.`,
  alternates: { canonical: "/terms" },
  openGraph: {
    title: `${productConfig.name} terms of service`,
    description: "Product use, analysis limits, user responsibilities, plans, and acceptable use.",
    url: "/terms",
  },
};

export default function TermsPage() {
  return (
    <LegalDocument
      description={`The rules for using ${productConfig.name}’s website, demo and live analysis, reports, AI-assisted suggestions, plans, private shares, and team workspaces.`}
      effectiveDate="July 23, 2026"
      sections={termsSections}
      title="Terms of service"
    />
  );
}
