"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, LogIn, Menu, ScanLine, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Brand } from "@/components/marketing/brand";
import { Button } from "@/components/ui/button";
import { features } from "@/content/features";
import { siteNavigation } from "@/content/site";
import { cn } from "@/lib/utils";

function NavigationLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
        active
          ? "bg-[var(--surface-muted)] text-[var(--primary-dark)]"
          : "text-[var(--text-secondary)] hover:text-[var(--text)]",
      )}
      href={href}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color:rgba(246,248,245,.92)] backdrop-blur-xl">
      <div className="container-shell flex h-[72px] items-center justify-between gap-5">
        <Brand />
        <nav aria-label="Main navigation" className="hidden items-center gap-0.5 lg:flex">
          <div className="group relative">
            <NavigationLink href="/features">
              <span className="inline-flex items-center gap-1">
                Features
                <ChevronDown
                  aria-hidden="true"
                  className="size-3.5 transition-transform group-hover:rotate-180 group-focus-within:rotate-180"
                />
              </span>
            </NavigationLink>
            <div className="invisible absolute left-1/2 top-[calc(100%+12px)] w-[620px] -translate-x-[32%] translate-y-1 rounded-[20px] border border-[var(--border)] bg-white p-3 opacity-0 shadow-[var(--shadow-lg)] transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <div className="grid grid-cols-2">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <Link
                      className="group/item flex gap-3 rounded-[14px] p-3 transition hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                      href={`/features/${feature.slug}`}
                      key={feature.slug}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-[var(--success-soft)] text-[var(--primary)]">
                        <Icon aria-hidden="true" className="size-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-[var(--text)]">
                          {feature.shortName}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-[var(--text-secondary)]">
                          {feature.description}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          {siteNavigation.slice(1).map((item) => (
            <NavigationLink href={item.href} key={item.href}>
              {item.label}
            </NavigationLink>
          ))}
        </nav>
        <div className="hidden items-center gap-1.5 md:flex">
          <Button asChild size="sm" variant="ghost">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/scan">
              <ScanLine aria-hidden="true" className="size-4" />
              Scan my resume
            </Link>
          </Button>
        </div>

        <Dialog.Root>
          <Dialog.Trigger asChild>
            <Button
              aria-label="Open navigation"
              className="md:hidden"
              size="icon"
              variant="secondary"
            >
              <Menu aria-hidden="true" className="size-5" />
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-[60] bg-[#10251c]/35 backdrop-blur-sm data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
            <Dialog.Content className="fixed inset-y-0 right-0 z-[70] flex w-[min(92vw,420px)] flex-col bg-[var(--background)] p-5 shadow-[-24px_0_70px_rgba(12,43,30,.2)] outline-none data-[state=closed]:translate-x-full data-[state=open]:translate-x-0 data-[state=closed]:opacity-0 data-[state=open]:opacity-100 transition duration-200">
              <div className="flex items-center justify-between">
                <Dialog.Title asChild>
                  <Brand />
                </Dialog.Title>
                <Dialog.Close asChild>
                  <Button aria-label="Close navigation" size="icon" variant="ghost">
                    <X aria-hidden="true" className="size-5" />
                  </Button>
                </Dialog.Close>
              </div>
              <Dialog.Description className="mt-5 text-sm leading-6 text-[var(--text-secondary)]">
                Transparent resume analysis with evidence connected to the document.
              </Dialog.Description>
              <nav aria-label="Mobile navigation" className="mt-8 flex-1 overflow-y-auto">
                <p className="px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  Explore
                </p>
                <div className="mt-2 grid">
                  {siteNavigation.map((item) => (
                    <Dialog.Close asChild key={item.href}>
                      <Link
                        className="rounded-[12px] px-3 py-3 text-base font-semibold hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                        href={item.href}
                      >
                        {item.label}
                      </Link>
                    </Dialog.Close>
                  ))}
                </div>
                <p className="mt-7 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  Analysis
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1">
                  {features.map((feature) => (
                    <Dialog.Close asChild key={feature.slug}>
                      <Link
                        className="rounded-[12px] px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-white hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                        href={`/features/${feature.slug}`}
                      >
                        {feature.shortName}
                      </Link>
                    </Dialog.Close>
                  ))}
                </div>
              </nav>
              <div className="grid gap-2 border-t border-[var(--border)] pt-5">
                <Dialog.Close asChild>
                  <Button asChild>
                    <Link href="/scan">
                      <ScanLine aria-hidden="true" className="size-4" />
                      Scan my resume
                    </Link>
                  </Button>
                </Dialog.Close>
                <Dialog.Close asChild>
                  <Button asChild variant="secondary">
                    <Link href="/login">
                      <LogIn aria-hidden="true" className="size-4" />
                      Log in
                    </Link>
                  </Button>
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
  );
}

