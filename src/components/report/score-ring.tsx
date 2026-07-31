"use client";

import { cn } from "@/lib/utils";

const tones = {
  green: "var(--primary)",
  amber: "var(--warning)",
  coral: "var(--danger)",
  blue: "var(--info)",
  violet: "var(--violet)",
} as const;

export function ScoreRing({
  score,
  label,
  size = "md",
  tone = "green",
  detail,
}: {
  score: number;
  label: string;
  size?: "sm" | "md" | "lg";
  tone?: keyof typeof tones;
  detail?: string;
}) {
  const dimension = size === "lg" ? 148 : size === "md" ? 104 : 70;
  const stroke = size === "lg" ? 8 : size === "md" ? 7 : 6;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circumference;

  return (
    <div className="inline-flex flex-col items-center text-center">
      <div
        className="relative grid place-items-center"
        style={{ width: dimension, height: dimension }}
        role="img"
        aria-label={`${label}: ${score} out of 100`}
      >
        <svg viewBox="0 0 100 100" className="-rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--surface-strong)" strokeWidth={stroke} />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={tones[tone]}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            className="animate-score"
          />
        </svg>
        <span
          className={cn(
            "absolute font-extrabold tracking-[-0.05em] text-[var(--text)]",
            size === "lg" ? "text-4xl" : size === "md" ? "text-2xl" : "text-base",
          )}
        >
          {score}
        </span>
      </div>
      <span className={cn("mt-2 font-bold", size === "sm" ? "text-[11px]" : "text-sm")}>{label}</span>
      {detail && <span className="mt-1 max-w-36 text-[11px] leading-4 text-[var(--text-muted)]">{detail}</span>}
    </div>
  );
}

