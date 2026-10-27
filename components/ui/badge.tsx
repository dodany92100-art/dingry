import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-md border border-transparent px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-[#0066FF]/50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border-white/20 text-white/80",
        "rotate-border":
          "btn-rotate-border cursor-pointer rounded-none border-2 bg-[#0a0a0a] px-8 py-3 text-[11px] tracking-[0.25em] uppercase text-white hover:text-[#0066FF]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = ComponentProps<"button"> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, type = "button", ...props }: BadgeProps) {
  return (
    <button
      type={type}
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
