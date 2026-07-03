type Item = { when: string; what: string };

export function Timeline({ items }: { items: Item[] }) {
  return (
    <ul className="relative m-0 list-none py-0 pr-0 pl-[1.4rem] before:absolute before:left-[0.28rem] before:top-[0.4rem] before:bottom-[0.4rem] before:w-px before:bg-line before:content-['']">
      {items.map((it) => (
        <li
          key={`${it.when}-${it.what}`}
          className="relative py-[0.5rem] before:absolute before:left-[-1.18rem] before:top-[0.95rem] before:h-2 before:w-2 before:rounded-[50%_0_50%_50%] before:rotate-45 before:bg-moss before:content-['']"
        >
          <span className="mr-[0.6rem] text-sm tabular-nums text-stone">{it.when}</span>
          {it.what}
        </li>
      ))}
    </ul>
  );
}
