import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 앱 소스가 아닌 것들 — 기획 문서·프로토타입(참고용)·툴링 산출물·빌드물
    "dong-docs/**",
    ".agents/**",
    ".claude/**",
    ".superpowers/**",
    ".velite/**",
  ]),
]);

export default eslintConfig;
