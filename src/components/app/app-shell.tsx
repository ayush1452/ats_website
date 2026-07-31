"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  CircleUserRound,
  Command,
  CreditCard,
  FileClock,
  FileText,
  FolderKanban,
  Gauge,
  History,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ScanLine,
  Search,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { productConfig } from "@/config/product";
import { DEMO_SCAN_ID } from "@/data/demo";
import { cn } from "@/lib/utils";

const primaryNavigation = [
  { label: "Overview", href: "/app", icon: Gauge },
  { label: "New scan", href: "/app/scan", icon: ScanLine },
  { label: "History", href: "/app/history", icon: History },
  { label: "Resumes", href: "/app/resumes", icon: FileText },
  { label: "Jobs", href: "/app/jobs", icon: BriefcaseBusiness },
  { label: "Compare", href: "/app/compare", icon: FolderKanban },
  { label: "Reports", href: "/app/reports", icon: FileClock },
] as const;

const secondaryNavigation = [
  { label: "Team", href: "/app/team", icon: Users },
  { label: "Billing", href: "/app/billing", icon: CreditCard },
  { label: "Settings", href: "/app/settings/profile", icon: Settings },
] as const;

function NavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: (typeof primaryNavigation)[number] | (typeof secondaryNavigation)[number];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const exactOverview = item.href === "/app";
  const active = exactOverview
    ? pathname === "/app" || pathname === "/app/overview"
    : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
        active
          ? "bg-[var(--primary)] text-white"
          : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]",
        collapsed && "justify-center px-2",
      )}
    >
      <Icon aria-hidden="true" className="size-[18px] shrink-0" strokeWidth={1.9} />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

function Navigation({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <nav aria-label="Workspace" className="mt-6 space-y-1">
        {primaryNavigation.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="mt-auto space-y-1 border-t border-[var(--border)] pt-4">
        {secondaryNavigation.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </div>
    </>
  );
}

function CommandSearch({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => {
    const all = [...primaryNavigation, ...secondaryNavigation];
    return all.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => {
        setQuery("");
        inputRef.current?.focus();
      }, 10);
    }
  }, [open]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) onClose();
      }
      if (event.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [onClose, open]);

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-[#0d1e16]/40 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[12vh] z-[90] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-[22px] border border-white/20 bg-white shadow-[var(--shadow-lg)] outline-none"
        >
          <Dialog.Title className="sr-only">Quick navigation</Dialog.Title>
        <label className="flex items-center gap-3 border-b border-[var(--border)] px-5">
          <Search aria-hidden="true" className="size-5 text-[var(--text-muted)]" />
          <span className="sr-only">Search destinations</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search workspace…"
            className="h-16 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[var(--text-muted)]"
          />
          <kbd className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1 text-[10px] font-bold text-[var(--text-muted)]">
            ESC
          </kbd>
        </label>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length ? (
            results.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                >
                  <Icon aria-hidden="true" className="size-4 text-[var(--primary)]" />
                  {item.label}
                </Link>
              );
            })
          ) : (
            <p className="px-3 py-8 text-center text-sm text-[var(--text-muted)]">
              No workspace destination matches “{query}”.
            </p>
          )}
        </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function AppShell({
  children,
  viewer,
}: {
  children: React.ReactNode;
  viewer: { displayName: string; email: string; demoSession: boolean };
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(pathname.startsWith("/app/scans/"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const reportMode = pathname.startsWith("/app/scans/");
  const seededReport = pathname === `/app/scans/${DEMO_SCAN_ID}` || pathname === "/app/scans/demo";
  const initials =
    viewer.displayName
      .split(/\s+/u)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || productConfig.shortName;

  if (pathname === "/app/onboarding") return <>{children}</>;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <aside
        aria-label="Primary navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-[var(--border)] bg-white px-3 py-4 transition-[width] duration-200 lg:flex lg:flex-col",
          collapsed ? "w-[76px]" : "w-[228px]",
        )}
      >
        <div className={cn("flex h-11 items-center", collapsed ? "justify-center" : "px-2")}>
          <Link
            href="/app"
            className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
            aria-label={`${productConfig.name} overview`}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[var(--primary)] text-xs font-black text-white">
              {productConfig.shortName}
            </span>
            {!collapsed && <span className="text-[15px] font-extrabold">{productConfig.name}</span>}
          </Link>
        </div>
        <Navigation collapsed={collapsed} />
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="mt-3 flex min-h-10 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen aria-hidden="true" className="size-[18px]" />
          ) : (
            <>
              <PanelLeftClose aria-hidden="true" className="mr-2 size-[18px]" />
              <span className="text-xs font-bold">Collapse</span>
            </>
          )}
        </button>
      </aside>

      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-[#0d1e16]/38 backdrop-blur-sm lg:hidden" />
          <Dialog.Content
            aria-describedby={undefined}
            aria-label="Mobile navigation"
            className="fixed inset-y-0 left-0 z-[70] flex w-[min(86vw,320px)] flex-col bg-white px-4 py-4 shadow-[var(--shadow-lg)] outline-none lg:hidden"
          >
            <Dialog.Title className="sr-only">Workspace navigation</Dialog.Title>
            <div className="flex h-11 items-center justify-between">
              <Link href="/app" className="flex items-center gap-2.5 font-extrabold">
                <span className="grid size-8 place-items-center rounded-[10px] bg-[var(--primary)] text-xs text-white">
                  {productConfig.shortName}
                </span>
                {productConfig.name}
              </Link>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" aria-label="Close navigation">
                  <X aria-hidden="true" className="size-5" />
                </Button>
              </Dialog.Close>
            </div>
            <Navigation collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div
        className={cn(
          "min-h-screen transition-[padding] duration-200",
          collapsed ? "lg:pl-[76px]" : "lg:pl-[228px]",
        )}
      >
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--border)] bg-[rgba(246,248,245,.9)] px-4 backdrop-blur-xl sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="lg:hidden"
          >
            <Menu aria-hidden="true" className="size-5" />
          </Button>
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="hidden h-10 min-w-0 max-w-sm flex-1 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 text-left text-sm text-[var(--text-muted)] shadow-[var(--shadow-sm)] hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] sm:flex"
          >
            <Search aria-hidden="true" className="size-4" />
            <span className="truncate">Search workspace</span>
            <span className="ml-auto flex items-center gap-1 text-[10px] font-bold">
              <Command aria-hidden="true" className="size-3" />K
            </span>
          </button>
          {reportMode && seededReport && (
            <span className="hidden rounded-full bg-[var(--success-soft)] px-3 py-1.5 text-xs font-bold text-[var(--primary)] xl:inline">
              Demo analysis
            </span>
          )}
          <div className="relative ml-auto">
            <Button
              variant="ghost"
              size="icon"
              aria-label={viewer.demoSession ? "Notifications, 1 demonstration item" : "Notifications"}
              aria-expanded={noticeOpen}
              onClick={() => {
                setNoticeOpen((value) => !value);
                setProfileOpen(false);
              }}
              className="relative"
            >
              <Bell aria-hidden="true" className="size-[19px]" />
              {viewer.demoSession ? <span className="absolute right-2 top-2 size-2 rounded-full bg-[var(--danger)] ring-2 ring-[var(--background)]" /> : null}
            </Button>
            {noticeOpen && (
              <div className="absolute right-0 top-12 w-[min(90vw,340px)] overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-lg)]">
                <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                  <strong className="text-sm">Notifications</strong>
                  <button
                    className="text-xs font-bold text-[var(--primary)]"
                    onClick={() => setNoticeOpen(false)}
                  >
                    Mark read
                  </button>
                </div>
                {viewer.demoSession ? (
                  <Link
                    href={`/app/scans/${DEMO_SCAN_ID}`}
                    onClick={() => setNoticeOpen(false)}
                    className="block border-b border-[var(--border)] px-4 py-3 hover:bg-[var(--surface-muted)]"
                  >
                    <p className="text-sm font-bold">Demonstration report is ready</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">Alex Morgan fixture · score 73</p>
                  </Link>
                ) : (
                  <p className="border-b border-[var(--border)] px-4 py-5 text-sm text-[var(--text-muted)]">
                    No unread notifications.
                  </p>
                )}
                <Link
                  href="/app/settings/notifications"
                  onClick={() => setNoticeOpen(false)}
                  className="block px-4 py-3 text-xs font-bold text-[var(--primary)]"
                >
                  Notification settings
                </Link>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((value) => !value);
                setNoticeOpen(false);
              }}
              aria-expanded={profileOpen}
              className="flex h-10 items-center gap-2 rounded-full pl-1 pr-2 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
            >
              <span className="grid size-8 place-items-center rounded-full bg-[#dfeee6] text-xs font-black text-[var(--primary-dark)]">
                {initials}
              </span>
              <ChevronDown aria-hidden="true" className="hidden size-4 text-[var(--text-muted)] sm:block" />
              <span className="sr-only">Open account menu</span>
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-12 w-56 rounded-2xl border border-[var(--border)] bg-white p-2 shadow-[var(--shadow-lg)]">
                <div className="border-b border-[var(--border)] px-3 py-2">
                  <p className="text-sm font-bold">{viewer.displayName}</p>
                  <p className="truncate text-xs text-[var(--text-muted)]">{viewer.email}</p>
                </div>
                <Link
                  href="/app/settings/profile"
                  onClick={() => setProfileOpen(false)}
                  className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-[var(--surface-muted)]"
                >
                  <CircleUserRound className="size-4" /> Profile settings
                </Link>
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-[var(--surface-muted)]"
                  >
                    <Sparkles className="size-4" /> Sign out
                  </button>
                </form>
              </div>
            )}
          </div>
        </header>
        <main id="main-content">{children}</main>
      </div>
      <CommandSearch open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}
