'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/shared/theme';
import styles from './Masthead.module.css';

const NAV = [
  { href: '/', key: 'home', label: 'Home' },
  { href: '/posts', key: 'posts', label: 'Posts' },
  { href: '/series', key: 'series', label: 'Series' },
  { href: '/about', key: 'about', label: 'About' },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === '/'
    ? pathname === '/'
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function Masthead() {
  const pathname = usePathname();

  return (
    <>
      {/* 브랜드 — 스크롤과 함께 사라짐 */}
      <header className={`${styles.masthead} wrap`}>
        <Link className={styles.brand} href='/'>
          <svg className={styles.leaf} aria-hidden='true'>
            <use href='#leaf' />
          </svg>
          <span className={styles.brandName}>DongCoding</span>
          <span className={styles.sub}>— 코드는 쉽지, 말을 보여줘</span>
        </Link>
      </header>
      {/* nav — body 직속 sibling이라 페이지 전체에서 상단 고정(sticky) */}
      <nav className={styles.navbar} aria-label='주 메뉴'>
        <div className={`${styles.nav} wrap`}>
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </div>
      </nav>
    </>
  );
}
