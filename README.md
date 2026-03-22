# alextuppen.com

Personal website for Alex Tuppen — full stack developer based in London. Features a blog, recipe collection, and experience/CV page.

Hosted on [Cloudflare Pages](https://pages.cloudflare.com/).

## Stack

- **Framework**: [Astro 6](https://astro.build/) (static, no SSR)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Content**: Astro content collections — blog (MDX), recipes (JSON), experience (JSON), education (JSON)
- **Search**: [Fuse.js](https://fusejs.io/) (client-side, vanilla JS)
- **Diagrams**: [astro-d2](https://github.com/HiDeoo/astro-d2) (skipped on Cloudflare Pages, runs locally)
- **Package manager**: pnpm

## Project structure

```
src/
├── components/       # Astro components
│   ├── Experience/   # Job, Education, ExpEduDetails, Technologies
│   ├── Header/       # Header, Menu
│   ├── Hero/         # Hero, HeroBackground (WebGL worker)
│   └── Recipe/       # Method, TimesServes, ToolsIngredients
├── content/          # Content collections
│   ├── blog/         # MDX posts
│   ├── recipes/      # JSON recipes (Schema.org format)
│   ├── experiences/  # JSON experience entries
│   └── education/    # JSON education entries
├── layouts/          # Root, BlogPost, Recipe
├── pages/            # File-based routing
├── styles/           # global.css (Tailwind @theme tokens)
├── svg/              # Inline SVG components
└── utils/            # Shared utilities (date formatting)
public/               # Static assets (images, fonts, logos)
```

## Commands

| Command        | Action                                    |
| :------------- | :---------------------------------------- |
| `pnpm install` | Install dependencies                      |
| `pnpm dev`     | Start dev server at `localhost:4321`      |
| `pnpm build`   | Build production site to `./dist/`        |
| `pnpm preview` | Preview production build locally          |
| `pnpm lint`    | Run ESLint                                |
