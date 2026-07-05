import { z } from "astro/zod";

export const blogSchema = z.object({
  title: z.string(),
  description: z.string(),
  // Transform string to Date object
  pubDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  updatedDate: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : undefined)),
  heroImage: z.string().optional(),
  heroImageText: z.string().optional(),
});
