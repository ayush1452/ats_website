"use client";

import { ChevronLeft, ChevronRight, FileText, LocateFixed, Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { CanonicalResumeDocument, ReportLens, ResumeAnnotation } from "@/types/domain";
import { cn } from "@/lib/utils";

function annotationTone(status: ResumeAnnotation["status"]) {
  if (status === "critical" || status === "high" || status === "missing") return "bg-[#ffdeda] decoration-[var(--danger)]";
  if (status === "medium" || status === "partial" || status === "uncertain" || status === "overused") return "bg-[#fff0bd] decoration-[var(--warning)]";
  if (status === "low" || status === "related") return "bg-[var(--info-soft)] decoration-[var(--info)]";
  return "bg-[var(--success-soft)] decoration-[var(--primary)]";
}

function lensMatches(lens: ReportLens, annotation: ResumeAnnotation) {
  if (lens === "default") return true;
  const label = annotation.label.toLowerCase();
  if (lens === "keywords") return label.includes("keyword") || ["missing", "matched", "related", "overused"].includes(annotation.status);
  if (lens === "format") return label.includes("format") || label.includes("parse") || label.includes("layout");
  if (lens === "impact") return label.includes("impact") || label.includes("metric") || label.includes("evidence");
  return label.includes("job") || label.includes("requirement") || ["matched", "partial", "missing"].includes(annotation.status);
}

interface Segment {
  text: string;
  annotation?: ResumeAnnotation;
}

function buildSegments(
  text: string,
  annotations: ResumeAnnotation[],
  lens: ReportLens,
  sourceStart = 0,
): Segment[] {
  const sourceEnd = sourceStart + text.length;
  const valid = annotations
    .filter(
      (annotation) =>
        annotation.end > sourceStart && annotation.start < sourceEnd,
    )
    .filter((annotation) => lensMatches(lens, annotation))
    .map((annotation) => ({
      ...annotation,
      start: Math.max(0, annotation.start - sourceStart),
      end: Math.min(text.length, annotation.end - sourceStart),
    }))
    .sort((left, right) => left.start - right.start);
  const segments: Segment[] = [];
  let cursor = 0;
  for (const annotation of valid) {
    if (annotation.start < cursor) continue;
    if (annotation.start > cursor) segments.push({ text: text.slice(cursor, annotation.start) });
    const end = Math.min(annotation.end, text.length);
    segments.push({ text: text.slice(annotation.start, end), annotation });
    cursor = end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

export function ResumePreview({
  document,
  annotations,
  selectedFindingId,
  onSelectFinding,
  lens,
  compact = false,
}: {
  document: CanonicalResumeDocument;
  annotations: ResumeAnnotation[];
  selectedFindingId?: string;
  onSelectFinding: (findingId: string) => void;
  lens: ReportLens;
  compact?: boolean;
}) {
  const [zoom, setZoom] = useState(88);
  const [page, setPage] = useState(1);
  const bodyRef = useRef<HTMLDivElement>(null);
  const pageRange = useMemo(() => {
    const spans = document.spans.filter((span) => span.page === page);
    if (spans.length) {
      return {
        start: Math.min(...spans.map((span) => span.start)),
        end: Math.max(...spans.map((span) => span.end)),
      };
    }
    const chunkSize = Math.ceil(
      document.normalizedText.length / Math.max(1, document.pageCount),
    );
    return {
      start: Math.min(document.normalizedText.length, (page - 1) * chunkSize),
      end: Math.min(document.normalizedText.length, page * chunkSize),
    };
  }, [document.normalizedText.length, document.pageCount, document.spans, page]);
  const pageText = document.normalizedText.slice(
    pageRange.start,
    pageRange.end,
  );
  const segments = useMemo(
    () => buildSegments(pageText, annotations, lens, pageRange.start),
    [annotations, lens, pageRange.start, pageText],
  );
  const visibleAnnotations = annotations.filter(
    (annotation) =>
      annotation.page === page && lensMatches(lens, annotation),
  );

  useEffect(() => {
    if (!selectedFindingId) return;
    const annotation = annotations.find(
      (item) => item.findingId === selectedFindingId,
    );
    const nextPage = annotation
      ? Math.min(document.pageCount, Math.max(1, annotation.page))
      : page;
    if (nextPage === page) return;
    const frame = window.requestAnimationFrame(() => setPage(nextPage));
    return () => window.cancelAnimationFrame(frame);
  }, [annotations, document.pageCount, page, selectedFindingId]);

  useEffect(() => {
    if (!selectedFindingId) return;
    const target = bodyRef.current?.querySelector<HTMLElement>(`[data-finding-id="${CSS.escape(selectedFindingId)}"]`);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [lens, page, selectedFindingId]);

  return (
    <section className={cn("flex min-h-0 flex-col bg-[var(--background-secondary)]", compact ? "h-full" : "h-[calc(100vh-64px)]")} aria-label="Annotated resume preview">
      <header className="flex min-h-14 items-center gap-2 border-b border-[var(--border)] bg-white px-3">
        <FileText aria-hidden="true" className="size-4 text-[var(--primary)]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-extrabold">{document.filename}</p>
          <p className="text-[10px] text-[var(--text-muted)]">{document.pageCount} page{document.pageCount === 1 ? "" : "s"} · {Math.round(document.extractionConfidence * 100)}% extraction confidence</p>
        </div>
        <button onClick={() => setZoom((value) => Math.max(62, value - 8))} aria-label="Zoom out" className="grid size-8 place-items-center rounded-full hover:bg-[var(--surface-muted)]"><Minus className="size-3.5" /></button>
        <span className="w-9 text-center text-[10px] font-bold text-[var(--text-muted)]">{zoom}%</span>
        <button onClick={() => setZoom((value) => Math.min(124, value + 8))} aria-label="Zoom in" className="grid size-8 place-items-center rounded-full hover:bg-[var(--surface-muted)]"><Plus className="size-3.5" /></button>
      </header>
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-white px-3 py-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)]">
          <LocateFixed className="size-3.5 text-[var(--primary)]" />
          {visibleAnnotations.length} highlight{visibleAnnotations.length === 1 ? "" : "s"} in {lens === "default" ? "all lenses" : `${lens} lens`}
        </div>
        <div className="flex items-center">
          <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} aria-label="Previous page" className="grid size-7 place-items-center rounded-full hover:bg-[var(--surface-muted)] disabled:opacity-30"><ChevronLeft className="size-3.5" /></button>
          <span className="px-1 text-[10px] font-bold">{page} / {document.pageCount}</span>
          <button disabled={page >= document.pageCount} onClick={() => setPage((value) => value + 1)} aria-label="Next page" className="grid size-7 place-items-center rounded-full hover:bg-[var(--surface-muted)] disabled:opacity-30"><ChevronRight className="size-3.5" /></button>
        </div>
      </div>
      <div ref={bodyRef} className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
        <article
          className="mx-auto min-h-[850px] max-w-[620px] origin-top bg-[#fffefb] p-8 font-serif text-[11px] leading-[1.65] text-[#202822] shadow-[0_12px_45px_rgba(23,35,29,.13)] sm:p-10"
          style={{ transform: `scale(${zoom / 100})`, marginBottom: `${Math.max(0, (zoom - 100) * 8)}px` }}
          aria-label={`Page ${page} resume text`}
        >
          {pageText ? segments.map((segment, index) =>
            segment.annotation ? (
              <button
                type="button"
                key={`${segment.annotation.id}-${index}`}
                data-finding-id={segment.annotation.findingId}
                onClick={() => onSelectFinding(segment.annotation?.findingId ?? "")}
                title={segment.annotation.label}
                className={cn(
                  "rounded-sm px-0.5 text-left font-inherit underline decoration-1 underline-offset-[3px] transition-[background,box-shadow]",
                  annotationTone(segment.annotation.status),
                  selectedFindingId === segment.annotation.findingId && "ring-2 ring-[var(--primary)] ring-offset-1",
                )}
                aria-pressed={selectedFindingId === segment.annotation.findingId}
              >
                {segment.text}
              </button>
            ) : (
              <span key={`plain-${index}`} className="whitespace-pre-wrap">{segment.text}</span>
            ),
          ) : (
            <p className="font-sans text-sm text-[var(--text-secondary)]">
              No extractable text was found on this page.
            </p>
          )}
        </article>
      </div>
    </section>
  );
}
