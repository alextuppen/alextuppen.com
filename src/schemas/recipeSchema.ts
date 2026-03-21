import { z } from "astro:content";

export const recipeSchema = z.object({
  "@context": z.literal("https://schema.org/"),
  "@type": z.literal("Recipe"),
  name: z.string(),
  image: z.string().array().optional(),
  author: z.object({
    "@type": z.literal("Person"),
    name: z.literal("Alex Tuppen"),
  }),
  datePublished: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  description: z.string(),
  creativeWorkStatus: z.union([z.literal("draft"), z.literal("published")]),
  prepTime: z.string(),
  cookTime: z.string(),
  totalTime: z.string(),
  keywords: z.string(),
  favourite: z.boolean().optional(),
  recipeYield: z.number(),
  recipeCategory: z.literal("Weeknight meal"),
  recipeIngredient: z.string().array(),
  tool: z.array(
    z.object({ "@type": z.literal("HowToTool"), name: z.string() }),
  ),
  recipeInstructions: z.array(
    z.object({
      "@type": z.literal("HowToStep"),
      name: z.string(),
      text: z.string().optional(),
      itemListElement: z
        .array(
          z.object({
            "@type": z.union([
              z.literal("HowToDirection"),
              z.literal("HowToTip"),
            ]),
            text: z.string(),
          }),
        )
        .optional(),
    }),
  ),
});
