import { cn } from '@/shared/lib/cn';

// 시그니처(채운 잎 + 문구) ↔ 저작권 (design.md §4.12).
// border-t는 full-width(body 직속 <footer>), 내용은 안쪽 wrap — masthead nav와 동일 패턴.
// 연락처 아이콘(RSS·GitHub·메일)은 About 콘텐츠로 이동(§4.10) — 푸터는 브랜드·저작권만.
export function Footer() {
  return (
    <footer className="mt-16 border-t border-line">
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pt-[1.6rem] pb-12 text-sm text-stone',
          'wrap',
        )}
      >
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 text-moss" aria-hidden='true'>
            <use href='#leaf-fill' />
          </svg>
          dongCoding
        </span>
        <p className="m-0 text-stone">© 2026 dongCoding. All rights reserved.</p>
      </div>
    </footer>
  );
}
