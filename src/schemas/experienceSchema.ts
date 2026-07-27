import { z } from "astro/zod";
import type { SchemaContext } from "astro:content";
import { educationSchema } from "./educationSchema";

export const technologySchema = z.union([
  z.literal("apollo"),
  z.literal("codegen"),
  z.literal("dotNet"),
  z.literal("fastify"),
  z.literal("gatsby"),
  z.literal("nextjs"),
  z.literal("react"),
  z.literal("urql"),
  z.literal("graphql"),
  z.literal("node"),
  z.literal("postgresql"),
  z.literal("sccm"),
  z.literal("bicep"),
  z.literal("cSharp"),
  z.literal("css"),
  z.literal("html"),
  z.literal("javascript"),
  z.literal("powerShell"),
  z.literal("typescript"),
  z.literal("yaml"),
  z.literal("aws"),
  z.literal("azure"),
  z.literal("azureDevops"),
  z.literal("heroku"),
  z.literal("eslint"),
  z.literal("git"),
  z.literal("npm"),
  z.literal("prettier"),
  z.literal("yarn"),
  z.literal("gcp"),
  z.literal("claudeCode"),
  z.literal("hex"),
]);

export const technologyAlternativeSchema = z.object({
  key: technologySchema,
  title: z.string(),
  alt: z.string(),
});

export const jobSchema = ({ image }: SchemaContext) =>
  educationSchema.extend({
    image: image().optional(),
    technologies: z
      .array(z.union([technologySchema, technologyAlternativeSchema]))
      .optional(),
    description: z.string().array(),
  });
