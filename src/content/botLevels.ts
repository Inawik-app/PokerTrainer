/** Bot difficulty / style setup copy — shared by setup UI and /regles. */

export type DifficultyPresetId =
  | "all_easy"
  | "all_medium"
  | "all_hard"
  | "mixed"
  | "random"
  | "custom";

export type StylePresetId = "mixed" | "all_same" | "custom";

export type BotLevelCard = {
  id: DifficultyPresetId;
  title: string;
  body: string[];
};

export const botLevelCards: BotLevelCard[] = [
  {
    id: "all_easy",
    title: "Tous en Facile",
    body: [
      "Les bots jouent surtout selon leurs cartes et font beaucoup d'erreurs.",
      "Idéal pour apprendre les règles et repérer les bonnes mains.",
    ],
  },
  {
    id: "all_medium",
    title: "Tous en Moyen",
    body: [
      "Les bots tiennent compte du prix pour suivre et de leurs chances, mais ignorent ta position et ton style.",
      "Bon pour travailler tes décisions de base.",
    ],
  },
  {
    id: "all_hard",
    title: "Tous en Difficile",
    body: [
      "Les bots estiment tes mains possibles, adaptent leurs mises et s'ajustent si tu bluffes souvent.",
      "Pour tester ta lecture des adversaires.",
    ],
  },
  {
    id: "mixed",
    title: "Mélange progressif",
    body: [
      "Environ 1/3 de chaque niveau, réparti au hasard sur les sièges.",
      "Une table variée comme en vrai : repérer les joueurs faibles est une compétence en soi.",
    ],
  },
  {
    id: "random",
    title: "Aléatoire",
    body: [
      "Chaque bot tire son niveau au hasard.",
      "Tu ne sais pas à l'avance si la table sera facile ou corsée.",
    ],
  },
  {
    id: "custom",
    title: "Personnalisé",
    body: [
      "Choisis le niveau et le style siège par siège.",
      "Utile pour t'entraîner contre un profil précis.",
    ],
  },
];

export type LevelSummaryRow = {
  level: "Facile" | "Moyen" | "Difficile";
  considers: string;
  errorRate: string;
};

export const botLevelSummary: LevelSummaryRow[] = [
  {
    level: "Facile",
    considers: "Surtout la force de ses cartes",
    errorRate: "Beaucoup",
  },
  {
    level: "Moyen",
    considers: "Prix pour suivre et chances de gagner",
    errorRate: "Quelques-unes",
  },
  {
    level: "Difficile",
    considers: "Tes mains possibles, tailles de mise, ton style",
    errorRate: "Rares",
  },
];

export const stylePresetCards: {
  id: StylePresetId;
  title: string;
  body: string;
}[] = [
  {
    id: "mixed",
    title: "Tous les styles mélangés",
    body: "Chaque bot reçoit un profil au hasard (prudent, large, suit tout…). Par défaut, comme une vraie table.",
  },
  {
    id: "all_same",
    title: "Un style au choix pour tous",
    body: "Tous les bots jouent le même profil. Idéal pour t'entraîner contre un type précis.",
  },
  {
    id: "custom",
    title: "Personnalisé",
    body: "Tu règles le style (et le niveau si besoin) pour chaque siège.",
  },
];

export const botLevelsSection = {
  title: "Les niveaux des bots",
  intro:
    "Le niveau change ce que le bot prend en compte et à quelle fréquence il se trompe — pas son style de jeu.",
  summaryTitle: "Récapitulatif des 3 niveaux",
  summaryConsiders: "Ce qu'il prend en compte",
  summaryErrors: "Fréquence d'erreurs",
  styleTitle: "Les styles de jeu",
  styleIntro:
    "Le style (prudent, large, suit tout…) est indépendant du niveau. Un bot Difficile « suit tout » reste un calling station — mais il se trompe moins souvent.",
} as const;

export const setupCopy = {
  difficultyTitle: "Niveau des bots",
  styleTitle: "Styles de jeu",
  revealTitle: "Afficher le niveau et le style des bots",
  revealHint:
    "Désactivé, tu dois deviner leur profil grâce à leurs stats.",
  summaryUnderCard: "Ce que ça change selon le niveau",
  globalStyleLabel: "Style pour tous",
  perSeatTitle: "Réglage par siège",
  levelLabel: "Niveau",
  styleLabel: "Style",
  easy: "Facile",
  medium: "Moyen",
  hard: "Difficile",
} as const;
