import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import {
  blogSchema,
  educationSchema,
  jobSchema,
  recipeSchema,
} from "./schemas";

const blog = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/blog",
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, ""),
  }),
  schema: blogSchema,
});

const education = defineCollection({
  loader: glob({
    pattern: "**/*.json",
    base: "./src/content/education",
    generateId: ({ entry }) => entry.replace(/\.json$/, ""),
  }),
  schema: educationSchema,
});

const experiences = defineCollection({
  loader: glob({
    pattern: "**/*.json",
    base: "./src/content/experiences",
    generateId: ({ entry }) => entry.replace(/\.json$/, ""),
  }),
  schema: jobSchema,
});

const recipes = defineCollection({
  loader: glob({
    pattern: "**/*.json",
    base: "./src/content/recipes",
    generateId: ({ entry }) => entry.replace(/\.json$/, ""),
  }),
  schema: recipeSchema,
});

export const collections = { blog, education, experiences, recipes };
