import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-[var(--surface-muted)] text-[var(--text-secondary)]",
  success: "bg-[var(--success-soft)] text-[var(--primary-dark)]",
  warning: "bg-[var(--warning-soft)] text-[#81520a]",
  danger: "bg-[var(--danger-soft)] text-[#a13f3a]",
  info: "bg-[var(--info-soft)] text-[#334da9]",
  violet: "bg-[var(--violet-soft)] text-[#5840ae]",
  premium: "bg-[#fff3dc] text-[#8c560d]",
} as const;

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
