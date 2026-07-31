import type { Metadata } from "next";

import { SharedReport } from "@/components/share/shared-report";

export const metadata: Metadata = {
  title: "Shared resume analysis",
  robots: { index: false, follow: false, nocache: true },
};

export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <SharedReport token={token} />;
}
