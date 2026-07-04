'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/shared/theme';
import { cn } from '@/shared/lib/cn';

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
      <header
        className={cn('pt-[clamp(1.15rem,3.5vh,2.75rem)] pb-[0.8rem]', 'wrap')}
      >
        <Link
          className='inline-flex items-center gap-[0.6rem] leading-[1.15]'
          href='/'
        >
          <svg className='h-[1.4rem] w-[1.4rem] text-moss' aria-hidden='true'>
            <use href='#leaf' />
          </svg>
          <span className='text-xl font-semibold tracking-[-0.02em] max-[480px]:text-lg'>
            DongCoding
          </span>
        </Link>
      </header>
      {/* nav — body 직속 sibling이라 페이지 전체에서 상단 고정(sticky) */}
      <nav
        className='sticky top-0 z-[var(--z-header)] border-b border-line bg-paper'
        aria-label='주 메뉴'
      >
        <div
          className={cn(
            'flex flex-wrap items-center gap-[1.4rem] py-2 text-sm leading-[1.3]',
            'max-[480px]:gap-[1.1rem]',
            '[&>*:last-child]:ml-auto',
            'wrap',
          )}
        >
          {NAV.map((item) => (
            <Link
              key={item.key}
              className='text-stone aria-[current=page]:font-medium aria-[current=page]:text-ink'
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
