import Link from "next/link";

import { productConfig } from "@/config/product";
import { cn } from "@/lib/utils";

export function Brand({
  className,
  inverse = false,
}: {
  className?: string;
  inverse?: boolean;
}) {
  return (
    <Link
      aria-label={`${productConfig.name} home`}
      className={cn("inline-flex items-center gap-2.5 font-bold tracking-[-0.03em]", className)}
      href="/"
    >
      <span
        aria-hidden="true"
        className={cn(
          "relative grid size-9 place-items-center overflow-hidden rounded-[12px]",
          inverse ? "bg-white text-[var(--primary-dark)]" : "bg-[var(--primary-dark)] text-white",
        )}
      >
        <span className="text-[11px] font-extrabold tracking-[-0.08em]">{productConfig.shortName}</span>
        <span
          className={cn(
            "absolute -bottom-2 -right-2 size-5 rounded-full",
            inverse ? "bg-[#bce9d1]" : "bg-[#43b57e]",
          )}
        />
      </span>
      <span className={cn("text-lg", inverse ? "text-white" : "text-[var(--text)]")}>
        {productConfig.name}
      </span>
    </Link>
  );
}

