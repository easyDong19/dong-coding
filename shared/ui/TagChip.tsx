import type { ComponentPropsWithoutRef } from "react";
import styles from "./TagChip.module.css";

export function TagChip({ className, children, ...rest }: ComponentPropsWithoutRef<"span">) {
  return (
    <span className={[styles.tag, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </span>
  );
}
