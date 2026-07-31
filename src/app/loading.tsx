export default function GlobalLoading() {
  return (
    <main id="main-content" className="min-h-screen animate-pulse bg-[var(--background)] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="h-12 w-44 rounded-xl bg-[var(--surface-strong)]" />
        <div className="mt-20 max-w-3xl">
          <div className="h-5 w-28 rounded bg-[var(--surface-strong)]" />
          <div className="mt-5 h-16 w-full rounded-2xl bg-[var(--surface-strong)]" />
          <div className="mt-3 h-16 w-4/5 rounded-2xl bg-[var(--surface-strong)]" />
        </div>
        <span className="sr-only">Loading page</span>
      </div>
    </main>
  );
}
