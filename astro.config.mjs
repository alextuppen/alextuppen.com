import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import d2 from "astro-d2";

// https://astro.build/config
export default defineConfig({
  site: "https://alextuppen.com",
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    mdx(),
    sitemap(),
    d2({
      layout: "elk",
      inline: true,
      pad: 25,
      // Disable generating diagrams when deploying on Cloudflare pages.
      skipGeneration: !!process.env["CF_PAGES"],
    }),
  ],
});
