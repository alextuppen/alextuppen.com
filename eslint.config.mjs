// @ts-check

import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";

export default defineConfig([
  {
    files: ["**/*.{js,ts,mjs,cjs,astro}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      ...astro.configs["flat/recommended"],
      jsxA11y.flatConfigs.recommended,
      prettier,
    ],
  },
  {
    rules: {
      eqeqeq: ["error", "always", { null: "ignore" }],
    },
  },
  {
    files: ["*.mjs", "*.cjs"],
    languageOptions: {
      globals: { process: "readonly" },
    },
  },
  {
    files: ["src/env.d.ts"],
    rules: {
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
  {
    ignores: ["dist/", ".astro/"],
  },
]);
