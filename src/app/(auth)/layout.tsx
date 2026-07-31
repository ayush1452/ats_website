import { FileCheck2, ScanSearch, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { productConfig } from "@/config/product";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(460px,0.8fr)]">
      <section className="flex min-h-screen items-center justify-center px-6 py-16 sm:px-10">
        {children}
      </section>
      <aside className="paper-grid relative hidden overflow-hidden bg-[var(--primary-dark)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-28 -top-28 size-96 rounded-full border border-white/10" />
        <Link className="relative flex items-center gap-3 text-xl font-bold" href="/">
          <span className="grid size-10 place-items-center rounded-xl bg-white text-[var(--primary)]">
            <ScanSearch className="size-5" aria-hidden="true" />
          </span>
          {productConfig.name}
        </Link>
        <div className="relative max-w-lg">
          <p className="mb-5 font-serif text-4xl leading-[1.15] tracking-[-0.025em]">
            Every score traces back to evidence you can review.
          </p>
          <p className="max-w-md leading-7 text-white/70">
            See parse risks, missing requirements, and stronger phrasing without turning a
            heuristic into a hiring promise.
          </p>
        </div>
        <div className="relative grid gap-4 border-t border-white/15 pt-7 text-sm text-white/75 sm:grid-cols-2">
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-[#8ee0b4]" aria-hidden="true" />
            Private by design
          </span>
          <span className="flex items-center gap-2">
            <FileCheck2 className="size-4 text-[#8ee0b4]" aria-hidden="true" />
            Heuristic, explained
          </span>
        </div>
      </aside>
    </main>
  );
}
