import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/shared/lib/cn";

export function TagChip({ className, children, ...rest }: ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={cn(
        "inline-block rounded-pill bg-moss-soft px-[0.55rem] py-[0.1rem] text-xs leading-[1.5] text-moss",
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
