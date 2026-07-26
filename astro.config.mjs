import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import d2 from "astro-d2";
import { unified } from "@astrojs/markdown-remark";

// https://astro.build/config
export default defineConfig({
  site: "https://alextuppen.com",
  markdown: {
    // astro-d2 injects raw multi-<style> SVGs as markdown "html" nodes. Astro's
    // new default `satteri` processor mangles that raw HTML (unclosed <style>
    // tags swallow the rest of the page); the classic remark/rehype pipeline
    // handles raw HTML nodes correctly.
    processor: unified(),
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
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
