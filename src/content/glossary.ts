export type GlossaryId =
  | "equity"
  | "outs"
  | "potOdds"
  | "spr"
  | "vpip"
  | "pfr"
  | "ev"
  | "blind"
  | "button"
  | "allIn"
  | "sidePot"
  | "range";

export const glossary: Record<
  GlossaryId,
  { term: string; definition: string }
> = {
  equity: {
    term: "Équité",
    definition:
      "Pourcentage de chances de gagner le pot à la fin, contre les adversaires encore en jeu.",
  },
  outs: {
    term: "Outs",
    definition:
      "Cartes restantes dans le paquet qui améliorent votre main.",
  },
  potOdds: {
    term: "Cote du pot",
    definition:
      "Rapport entre la mise à payer et la taille du pot après votre call. Indique l'équité minimale requise.",
  },
  spr: {
    term: "SPR",
    definition:
      "Stack-to-Pot Ratio : tapis effectif divisé par le pot. Un SPR bas pousse à s'engager plus facilement.",
  },
  vpip: {
    term: "VPIP",
    definition:
      "Voluntarily Put money In Pot : pourcentage de mains où le joueur met de l'argent volontairement (pas les blinds).",
  },
  pfr: {
    term: "PFR",
    definition:
      "Preflop Raise : pourcentage de mains où le joueur relance avant le flop.",
  },
  ev: {
    term: "EV",
    definition:
      "Expected Value : gain moyen attendu d'une décision sur le long terme, en jetons.",
  },
  blind: {
    term: "Blind",
    definition:
      "Mise forcée avant de recevoir des cartes. Petite blind et grosse blind font tourner le pot.",
  },
  button: {
    term: "Bouton",
    definition:
      "Repère du donneur. Le joueur au bouton parle en dernier après le flop (avantage de position).",
  },
  allIn: {
    term: "Tapis",
    definition:
      "Miser tout son stack. On ne peut plus se coucher, et des side pots peuvent se créer.",
  },
  sidePot: {
    term: "Side pot",
    definition:
      "Pot secondaire créé quand un joueur est à tapis pour un montant inférieur aux autres.",
  },
  range: {
    term: "Range",
    definition:
      "Ensemble des mains possibles d'un adversaire, déduit de ses actions.",
  },
};
