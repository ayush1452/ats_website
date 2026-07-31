"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-[background,color,border,transform,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 active:translate-y-px",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--primary)] text-white shadow-[0_8px_20px_rgba(14,107,73,.18)] hover:bg-[var(--primary-hover)]",
        secondary:
          "border border-[var(--border-strong)] bg-white text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)]",
        ghost:
          "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]",
        danger:
          "bg-[var(--danger)] text-white hover:bg-[#bd4944]",
      },
      size: {
        sm: "min-h-9 px-3.5 text-xs",
        md: "min-h-11 px-5",
        lg: "min-h-12 px-6 text-base",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : "button";
    return (
      <Component
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
