import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  ...astro.configs["flat/recommended"],
  jsxA11y.flatConfigs.recommended,
  prettier,
  {
    rules: {
      eqeqeq: ["error", "always", { null: "ignore" }],
    },
  },
  {
    // astro.config.mjs and other Node.js config files need process global
    files: ["*.mjs", "*.cjs"],
    languageOptions: {
      globals: { process: "readonly" },
    },
  },
  {
    // env.d.ts uses triple-slash references — this is Astro's recommended pattern
    files: ["src/env.d.ts"],
    rules: {
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
  {
    ignores: ["dist/", ".astro/"],
  },
);
