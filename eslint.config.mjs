import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

/** Konfigurasi ESLint: preset Next.js (core-web-vitals + TypeScript). */
export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // next/image menyusul di Fase 4 (migrasi next/image) - jangan blok lint dulu.
      "@next/next/no-img-element": "off",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "out/**"],
  },
];
