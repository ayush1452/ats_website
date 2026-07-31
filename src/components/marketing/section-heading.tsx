import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.045em] text-[var(--text)] sm:text-4xl lg:text-[3.15rem] lg:leading-[1.08]">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

