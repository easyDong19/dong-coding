export type ResolvedImage =
  | { kind: "next"; src: string; alt: string; width: number; height: number }
  | { kind: "img"; src: string; alt: string };

function toPositiveInt(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

export function resolveImageProps(props: {
  src?: unknown;
  alt?: unknown;
  width?: unknown;
  height?: unknown;
}): ResolvedImage | null {
  const src = typeof props.src === "string" ? props.src : undefined;
  if (!src) return null;
  const alt = typeof props.alt === "string" ? props.alt : "";
  const width = toPositiveInt(props.width);
  const height = toPositiveInt(props.height);
  const remote = /^https?:\/\//.test(src);
  if (!remote && width && height) return { kind: "next", src, alt, width, height };
  return { kind: "img", src, alt };
}
