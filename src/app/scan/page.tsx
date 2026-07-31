import Link from "next/link";

import { ScanWizard } from "@/components/app/scan-wizard";
import { productConfig } from "@/config/product";

export const metadata = {
  title: `Scan your resume | ${productConfig.name}`,
  description: "Create a transparent resume evidence report from a PDF, DOCX, TXT, or pasted resume.",
};

export default function PublicScanPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="border-b border-[var(--border)] bg-white px-4 py-2 text-center text-[11px] leading-5 text-[var(--text-secondary)]">
        Exploring without an account? Your demo draft stays on this device.{" "}
        <Link href="/signup" className="font-bold text-[var(--primary)] underline underline-offset-2">Create an account to keep it</Link>
      </div>
      <ScanWizard />
    </div>
  );
}

