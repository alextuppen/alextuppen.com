import { z } from "astro/zod";

export const expEduDetailsSchema = z.object({
  title: z.string(),
  organisation: z.string(),
  location: z.string(),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.optional(z.string().transform((val) => new Date(val))),
  roleType: z.string(),
});
