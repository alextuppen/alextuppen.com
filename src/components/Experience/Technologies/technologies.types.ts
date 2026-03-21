import type { z } from "astro:content";
import type {
  technologySchema,
  technologyAlternativeSchema,
} from "../../../schemas";

export type Technology = z.infer<typeof technologySchema>;

export type TechnologyAlternative = z.infer<typeof technologyAlternativeSchema>;

export type Technologies = (Technology | TechnologyAlternative)[];

export type TechnologyDictionary = {
  [key in Technology]: {
    src: string;
    title: string;
    alt: string;
  };
};
