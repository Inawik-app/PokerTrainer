/** Player profile education content — used by /regles and coach UI. */

export type AxisPoint = {
  /** 0 = prudent (tight), 1 = large (loose) */
  loose: number;
  /** 0 = passif, 1 = agressif */
  aggressive: number;
};

export type PlayerStatKey = "vpip" | "pfr" | "af";

export type PlayerStatExplainer = {
  key: PlayerStatKey;
  simple: string;
  poker: string;
  sentence: string;
  example: string;
};

export const playerStatExplainers: PlayerStatExplainer[] = [
  {
    key: "vpip",
    simple: "Mains jouées",
    poker: "VPIP",
    sentence:
      "Pourcentage de mains où le joueur met des jetons volontairement avant le flop (hors mises obligatoires).",
    example:
      "Exemple : 40 % = il joue environ 4 mains sur 10 — plutôt large.",
  },
  {
    key: "pfr",
    simple: "Mains relancées avant le flop",
    poker: "PFR",
    sentence:
      "Pourcentage de mains où il relance avant le flop, au lieu de seulement suivre.",
    example:
      "Exemple : 18 % = il relance souvent ses bonnes mains ; 5 % = il préfère suivre.",
  },
  {
    key: "af",
    simple: "Agressivité",
    poker: "AF",
    sentence:
      "Il mise et relance souvent, ou il se contente surtout de suivre.",
    example:
      "Exemple : AF élevé = beaucoup de mises/relances ; AF bas = suit et parle davantage.",
  },
];

export const statsReliabilityNote =
  "Il faut au moins 20 à 30 mains observées avant de tirer des conclusions : avec peu de données, les pourcentages trompent facilement.";

export type ProfileId =
  | "TAG"
  | "LAG"
  | "TIGHT_PASSIVE"
  | "LOOSE_PASSIVE"
  | "FISH";

export type PlayerProfileContent = {
  id: ProfileId;
  simpleName: string;
  pokerName: string;
  description: [string, string];
  typicalStats: {
    vpip: string;
    pfr: string;
    aggression: string;
  };
  howToSpot: string[];
  howToPlay: string[];
  axis: AxisPoint;
};

export const playerProfiles: PlayerProfileContent[] = [
  {
    id: "TAG",
    simpleName: "Prudent et agressif",
    pokerName: "TAG",
    description: [
      "Joue peu de mains, mais les joue fort quand il s'y met.",
      "Ses relances ont souvent une vraie main derrière — à respecter.",
    ],
    typicalStats: {
      vpip: "18–24 %",
      pfr: "14–18 %",
      aggression: "élevée",
    },
    howToSpot: [
      "Relance souvent au lieu de seulement suivre.",
      "Se couche beaucoup avant le flop.",
      "Mise régulièrement après le flop quand il a ouvert.",
    ],
    howToPlay: [
      "Respecte ses relances : il a souvent une main solide.",
      "Vole ses blindes en position avec des mains moyennes.",
      "Ne bluffe pas trop contre lui après le flop — il paie rarement sans rien.",
    ],
    axis: { loose: 0.22, aggressive: 0.78 },
  },
  {
    id: "LAG",
    simpleName: "Large et agressif",
    pokerName: "LAG",
    description: [
      "Joue beaucoup de mains et met souvent la pression avec des mises.",
      "Difficile à lire : il peut bluffer ou avoir une très bonne main.",
    ],
    typicalStats: {
      vpip: "28–38 %",
      pfr: "22–30 %",
      aggression: "très élevée",
    },
    howToSpot: [
      "Entre dans beaucoup de pots et relance souvent.",
      "Mise fréquente même sur des boards peu favorables.",
      "Rarement à parole : il préfère attaquer.",
    ],
    howToPlay: [
      "Paye un peu plus large avec des mains moyennes — il bluffe assez.",
      "Laisse-le miser pour toi quand tu as une main forte.",
      "Évite de te battre pour de petits pots hors position contre lui.",
    ],
    axis: { loose: 0.72, aggressive: 0.88 },
  },
  {
    id: "TIGHT_PASSIVE",
    simpleName: "Très prudent",
    pokerName: "Rock",
    description: [
      "Joue très peu de mains et relance rarement.",
      "Quand il mise gros, sa main est presque toujours très forte.",
    ],
    typicalStats: {
      vpip: "8–14 %",
      pfr: "4–8 %",
      aggression: "faible",
    },
    howToSpot: [
      "Se couche la plupart des mains avant le flop.",
      "Suit plus qu'il ne relance.",
      "Ses mises après le flop sont rares et souvent grosses.",
    ],
    howToPlay: [
      "Bluffe plus souvent — il se couche facilement.",
      "Couche-toi face à ses relances sans une main très forte.",
      "Vole ses blindes régulièrement : il abandonne trop souvent.",
    ],
    axis: { loose: 0.12, aggressive: 0.22 },
  },
  {
    id: "LOOSE_PASSIVE",
    simpleName: "Suit tout",
    pokerName: "Calling station",
    description: [
      "Suit trop souvent et se couche rarement face à une mise.",
      "Les bluffs marchent mal contre lui : il paie avec n'importe quoi.",
    ],
    typicalStats: {
      vpip: "40–55 %",
      pfr: "5–10 %",
      aggression: "très faible",
    },
    howToSpot: [
      "Suit beaucoup, relance très peu.",
      "Reste dans le pot même avec un prix élevé.",
      "Parle souvent après le flop au lieu de miser.",
    ],
    howToPlay: [
      "Ne bluffe pas : il paie.",
      "Mise plus gros quand tu as une bonne main pour le faire payer.",
      "Avec une main moyenne, mise pour la valeur plutôt que de parler.",
    ],
    axis: { loose: 0.82, aggressive: 0.18 },
  },
  {
    id: "FISH",
    simpleName: "Imprévisible",
    pokerName: "Fish",
    description: [
      "Fait des erreurs de taille de mise et paie souvent trop cher.",
      "Son jeu change d'une main à l'autre — difficile à classer.",
    ],
    typicalStats: {
      vpip: "45–60 %",
      pfr: "8–15 %",
      aggression: "irrégulière",
    },
    howToSpot: [
      "Tailles de mise étranges (trop petites ou trop grosses).",
      "Entre dans beaucoup de pots sans raison claire.",
      "Ses stats ne collent à aucun profil propre.",
    ],
    howToPlay: [
      "Mise pour la valeur avec tes bonnes mains.",
      "Évite les bluffs compliqués — joue simple.",
      "Laisse-le se tromper : ne force pas des coups inventifs.",
    ],
    axis: { loose: 0.88, aggressive: 0.42 },
  },
];

export const profilesSection = {
  title: "Les profils de joueurs",
  intro:
    "Lire un adversaire, c'est repérer comment il joue grâce à quelques chiffres, puis adapter ton jeu.",
  statsTitle: "Les 3 statistiques pour lire un joueur",
  axisTitle: "Où se placent les profils",
  axisLooseLow: "Prudent",
  axisLooseHigh: "Large",
  axisAggLow: "Passif",
  axisAggHigh: "Agressif",
  typicalStatsLabel: "Stats typiques",
  howToSpotLabel: "Comment le reconnaître",
  howToPlayLabel: "Comment jouer contre lui",
  vpipShort: "Mains jouées",
  pfrShort: "Relancées",
  afShort: "Agressivité",
} as const;
