"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/shared/theme";
import styles from "./Masthead.module.css";

const NAV = [
  { href: "/", key: "home", label: "Home" },
  { href: "/posts", key: "posts", label: "Posts" },
  { href: "/series", key: "series", label: "Series" },
  { href: "/about", key: "about", label: "About" },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Masthead() {
  const pathname = usePathname();

  return (
    <header className={`${styles.masthead} wrap`}>
      <div className={styles.top}>
        <div>
          <Link className={styles.brand} href="/">
            <svg className={styles.leaf} aria-hidden="true">
              <use href="#leaf" />
            </svg>
            <span className={styles.brandName}>dongCoding</span>
            <span className={styles.sub}>— 천천히 자라는 기록</span>
          </Link>
          <p className={styles.lede}>코드와 식물 사이. 로딩 바도 팝업도 없이, 글에 집중하도록.</p>
        </div>
        <ThemeToggle />
      </div>
      <nav className={styles.nav} aria-label="주 메뉴">
        {NAV.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={isActive(pathname, item.href) ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
        {/* RSS는 후속 플랜에서 연결 (tech-stack §6.5) */}
        <a className={styles.spring} href="#" aria-label="RSS 피드">
          RSS
        </a>
      </nav>
    </header>
  );
}
