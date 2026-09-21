import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

/**
 * Flat config. eslint-config-next 16 ships native flat configs, so no
 * FlatCompat shim is needed (and the shim in fact crashes on it).
 */
export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "public/**",
      "supabase/**",
      "db/**",
      "scripts/**",
    ],
  },

  ...nextCoreWebVitals,
  ...nextTypescript,

  {
    rules: {
      // The codebase leans on `any` where Supabase's generated types don't
      // line up with a hand-written join. Surfaced as a warning, not blocking.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // Plain <img> is intentional: next.config.mjs sets images.unoptimized,
      // so next/image buys nothing here.
      "@next/next/no-img-element": "off",

      // React Compiler-era rules. They flag patterns that work correctly today
      // but are not compiler-optimal — mostly `setState` in an effect after a
      // fetch. Fixing all ~80 sites is a real refactor, so they are warnings
      // for now rather than something that silently gets disabled later.
      // Worth burning down before enabling the React Compiler.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/refs": "warn",

      // Apostrophes and quotes in user-facing copy. Cosmetic.
      "react/no-unescaped-entities": "warn",
    },
  },

  {
    // Config files are CommonJS by convention.
    files: ["*.config.{js,ts,mjs,cjs}", "tailwind.config.ts", "postcss.config.mjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },

  {
    // backend/services/twilio.ts deliberately require()s twilio so the SDK is
    // never pulled into a client bundle.
    files: ["backend/**/*.ts"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
]
