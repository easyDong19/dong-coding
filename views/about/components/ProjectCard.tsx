type Project = { title: string; description: string; href?: string };

const projectClass =
  "block rounded-pre border border-line p-4 text-inherit hover:border-moss";

// 프로젝트 그리드
export function Projects({ items }: { items: Project[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4">
      {items.map((p) => {
        const inner = (
          <>
            <h3 className="mx-0 mt-0 mb-[0.3rem] text-base font-semibold">{p.title}</h3>
            <p className="m-0 text-sm text-stone">{p.description}</p>
          </>
        );
        return p.href ? (
          <a key={p.title} className={projectClass} href={p.href}>
            {inner}
          </a>
        ) : (
          <div key={p.title} className={projectClass}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
