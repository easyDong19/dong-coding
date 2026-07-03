import { cn } from '@/shared/lib/cn';

// RSS·GitHub·메일 링크는 후속(RSS/OG) 플랜에서 실제 URL 연결
export function Footer() {
  return (
    <footer
      className={cn(
        'mt-16 flex flex-col gap-4 border-t border-line pt-[1.6rem] pb-12 text-sm text-stone',
        'wrap',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 text-moss" aria-hidden='true'>
            <use href='#leaf-fill' />
          </svg>
          dongCoding
        </span>
        <span className="flex gap-4">
          <a className="text-stone hover:text-ink" href='#'>RSS</a>
          <a className="text-stone hover:text-ink" href='#'>GitHub</a>
          <a className="text-stone hover:text-ink" href='#'>메일</a>
        </span>
      </div>
      <p className="m-0 text-stone">
        © 2026 dongCoding. All rights reserved.
      </p>
    </footer>
  );
}
