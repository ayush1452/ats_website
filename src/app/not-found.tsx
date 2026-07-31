import { Compass } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { productConfig } from "@/config/product";

export default function NotFound() {
  return (
    <main id="main-content" className="paper-grid grid min-h-screen place-items-center px-6">
      <div className="max-w-xl text-center">
        <span className="mx-auto mb-7 grid size-16 place-items-center rounded-[20px] bg-[var(--primary-dark)] text-white shadow-xl">
          <Compass className="size-7" aria-hidden="true" />
        </span>
        <p className="eyebrow mb-3">404 · Page not found</p>
        <h1 className="text-5xl font-bold tracking-[-0.055em] sm:text-6xl">
          This path is not in your report.
        </h1>
        <p className="mx-auto mt-5 max-w-lg leading-7 text-[var(--text-secondary)]">
          The link may have expired or moved. Return to {productConfig.name} or start a fresh
          analysis.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/scan">Start a scan</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
