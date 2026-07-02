"use client";

import * as runtime from "react/jsx-runtime";
import { useMemo, type ComponentType } from "react";

export type MDXComponentMap = Readonly<Record<string, ComponentType<Record<string, unknown>>>>;
type MDXModule = { default: ComponentType<{ components?: MDXComponentMap }> };

// Velite s.mdx()가 준 함수 본문(code)을 jsx 런타임으로 평가하는 범용 렌더러 (tech-stack §3.2).
// 특정 위젯을 모른다 — components 맵으로 주입받는다.
export function MDXContent({ code, components }: { code: string; components?: MDXComponentMap }) {
  const Component = useMemo(() => {
    // code는 `const{jsx}=arguments[0];...return{default:...}` 형태 → 런타임을 인자로 호출
    const factory = new Function(code) as (rt: typeof runtime) => MDXModule;
    return factory(runtime).default;
  }, [code]);

  return <Component components={components} />;
}
