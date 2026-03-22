import type {
  technologySchema,
  technologyAlternativeSchema,
} from "../../../schemas";

export type Technology = ReturnType<(typeof technologySchema)["parse"]>;

export type TechnologyAlternative = ReturnType<(typeof technologyAlternativeSchema)["parse"]>;

export type Technologies = (Technology | TechnologyAlternative)[];

export type TechnologyDictionary = {
  [key in Technology]: {
    src: string;
    title: string;
    alt: string;
  };
};
