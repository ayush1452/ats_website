import { cn } from "@/lib/utils";

export function ScoreRing({
  score,
  label,
  size = "lg",
  className,
}: {
  score: number;
  label: string;
  size?: "sm" | "lg";
  className?: string;
}) {
  const normalizedScore = Math.max(0, Math.min(100, score));
  const dimensions = size === "lg" ? "size-32" : "size-16";

  return (
    <div
      aria-label={`${label}: ${normalizedScore} out of 100`}
      className={cn("relative inline-grid place-items-center", dimensions, className)}
      role="img"
    >
      <svg aria-hidden="true" className="size-full -rotate-90" viewBox="0 0 42 42">
        <circle
          cx="21"
          cy="21"
          fill="none"
          r="15.915"
          stroke="var(--surface-strong)"
          strokeWidth="3"
        />
        <circle
          className="animate-score"
          cx="21"
          cy="21"
          fill="none"
          pathLength="100"
          r="15.915"
          stroke="var(--primary)"
          strokeDasharray={`${normalizedScore} ${100 - normalizedScore}`}
          strokeLinecap="round"
          strokeWidth="3"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">
        <span
          className={cn(
            "font-semibold tracking-[-0.06em] text-[var(--text)]",
            size === "lg" ? "text-4xl" : "text-lg",
          )}
        >
          {normalizedScore}
        </span>
      </span>
    </div>
  );
}

