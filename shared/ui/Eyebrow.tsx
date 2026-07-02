import type { ComponentPropsWithoutRef } from "react";
import styles from "./Eyebrow.module.css";

// moss·500·자간으로 구분되는 라벨. 사용처에서 className으로 여백만 얹는다.
export function Eyebrow({ className, children, ...rest }: ComponentPropsWithoutRef<"span">) {
  return (
    <span className={[styles.eyebrow, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </span>
  );
}
