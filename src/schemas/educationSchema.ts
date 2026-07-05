import { z } from "astro/zod";
import { expEduDetailsSchema } from "./expEduDetailsSchema";

export const educationSchema = z.object({
  details: expEduDetailsSchema,
});
