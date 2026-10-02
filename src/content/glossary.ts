import { terms, type WordingTermId } from "./wording";

export type GlossaryId = WordingTermId;

/** Back-compat glossary built from wording terms. */
export const glossary: Record<
  string,
  { term: string; definition: string }
> = Object.fromEntries(
  Object.values(terms).map((t) => [
    t.id,
    { term: t.poker, definition: t.tip },
  ]),
);
