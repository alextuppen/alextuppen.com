# alextuppen.com — Claude Context

Personal website for Alex Tuppen. Hosted on Cloudflare Pages.

## Stack

- **Framework**: Astro 6 (static, no SSR)
- **Package manager**: pnpm
- **Styling**: Tailwind CSS v4 + `@tailwindcss/typography`
- **Content**: Astro content collections (Zod schemas), new loader API (`src/content.config.ts`)
  - Blog — MDX in `src/content/blog/`
  - Recipes — JSON in `src/content/recipes/`
  - Experience — JSON in `src/content/experiences/`
  - Education — JSON in `src/content/education/`
- **Diagrams**: `astro-d2` (skipped on Cloudflare Pages, runs locally)
- **Search**: Fuse.js (vanilla JS, inline `<script>` in `BlogRecipeList.astro`)
- **Deployment**: Cloudflare Pages

## Architecture

- Pure Astro — no UI frameworks (Solid, React, Vue)
- All interactivity via vanilla JS in Astro `<script>` tags
- Single flat `src/components/Astro/` component directory
- Tailwind theme defined in `src/styles/global.css` via `@theme {}`
- Custom colours: `primary` (#f9ab01), `base` (#120f08), `surface-1` through `surface-9`

## Key files

- `src/consts.ts` — site title, description, social URLs
- `src/styles/global.css` — Tailwind imports, `@theme` tokens, Matrix font face
- `src/content.config.ts` — content collection schemas with glob loaders
- `src/layouts/Root.astro` — root HTML shell, imports global.css, BaseHead, Header, Footer
- `src/layouts/BlogPost.astro` — blog post layout, uses `prose prose-invert` for MDX content
- `src/layouts/Recipe.astro` — recipe detail layout
- `src/pages/` — file-based routing
- `src/components/Astro/BlogRecipeList.astro` — search/filter list (Fuse.js, vanilla JS)
- `src/components/Astro/BlogRecipeItem.astro` — single card, used on homepage

## Notes

- `pnpm.overrides` pins `@astrojs/internal-helpers` to `^0.8.0` — needed to resolve a peer conflict between `astro@6` and `astro-d2`
- Content collection IDs no longer include file extensions (stripped via `generateId` in loaders)
- `@tailwindcss/vite` plugin used directly — not `@astrojs/tailwind` (which only supports Tailwind v3)
