import Link from "next/link";

import { Brand } from "@/components/marketing/brand";
import { NewsletterForm } from "@/components/marketing/newsletter-form";
import { productConfig } from "@/config/product";
import { footerGroups } from "@/content/site";

export function MarketingFooter() {
  const socialLinks = [
    { label: "LinkedIn", href: productConfig.socialLinks.linkedin },
    { label: "X", href: productConfig.socialLinks.x },
  ].filter((item): item is { label: string; href: string } => Boolean(item.href));

  return (
    <footer className="bg-[var(--primary-dark)] text-white">
      <div className="container-shell py-14 sm:py-20">
        <div className="grid gap-12 border-b border-white/12 pb-14 lg:grid-cols-[1.1fr_2fr]">
          <div>
            <Brand inverse />
            <p className="mt-5 max-w-md text-sm leading-7 text-white/68">
              A transparent resume analysis workspace for parseability, role alignment,
              recruiter clarity, and evidence-led improvements.
            </p>
            <div className="mt-8">
              <p className="text-sm font-semibold">One practical resume note, occasionally.</p>
              <p className="mt-1 text-xs text-white/65">No urgency theater. Unsubscribe anytime.</p>
              <NewsletterForm />
            </div>
          </div>
          <nav
            aria-label="Footer navigation"
            className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-5"
          >
            {footerGroups.map((group) => (
              <div key={group.label}>
                <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-white/65">
                  {group.label}
                </h2>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        className="text-sm text-white/72 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        href={link.href}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-5 pt-7 text-xs leading-5 text-white/65 md:flex-row md:items-end md:justify-between">
          <p className="max-w-3xl">
            {productConfig.name} scores are configurable product heuristics. They do not guarantee
            compatibility with every third-party ATS, interviews, or employment. Verify every
            suggestion before using it.
          </p>
          <div className="flex shrink-0 gap-4">
            {socialLinks.map((link) => (
              <a
                className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                href={link.href}
                key={link.label}
                rel="noreferrer"
                target="_blank"
              >
                {link.label}
              </a>
            ))}
            <span>© {new Date().getFullYear()} {productConfig.name}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
