import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/shared/lib/cn";

// moss·500·자간으로 구분되는 라벨. 사용처에서 className으로 여백만 얹는다.
export function Eyebrow({ className, children, ...rest }: ComponentPropsWithoutRef<"span">) {
  return (
    <span className={cn("font-sans text-sm font-medium tracking-[0.01em] text-moss", className)} {...rest}>
      {children}
    </span>
  );
}
