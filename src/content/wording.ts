/** All user-facing UI labels. Components import from here — no hardcoded copy. */

export type VocabMode = "simple" | "poker";

export type TermEntry = {
  id: string;
  /** Beginner-friendly label (default mode). */
  simple: string;
  /** Official poker term. */
  poker: string;
  /** One-sentence tooltip. */
  tip: string;
};

export const terms = {
  equity: {
    id: "equity",
    simple: "Tes chances de gagner",
    poker: "Équité",
    tip: "Pourcentage de chances de remporter le pot à la fin, contre les adversaires encore en jeu.",
  },
  win: {
    id: "win",
    simple: "Gagner",
    poker: "Win",
    tip: "Part des simulations où tu remportes le pot seul.",
  },
  tie: {
    id: "tie",
    simple: "Égalité",
    poker: "Tie",
    tip: "Part des cas où tu partages le pot avec au moins un adversaire.",
  },
  lose: {
    id: "lose",
    simple: "Perdre",
    poker: "Lose",
    tip: "Part des cas où un adversaire a une meilleure main que toi.",
  },
  outs: {
    id: "outs",
    simple: "Cartes qui t'aident",
    poker: "Outs",
    tip: "Cartes encore dans le paquet qui améliorent ta main.",
  },
  potOdds: {
    id: "potOdds",
    simple: "Prix pour suivre",
    poker: "Cote du pot",
    tip: "Combien tu dois payer par rapport à la taille du pot — pour savoir si suivre vaut le coup.",
  },
  requiredEquity: {
    id: "requiredEquity",
    simple: "Chances minimum pour que suivre vaille le coup",
    poker: "Équité requise",
    tip: "Pourcentage de chances minimum dont tu as besoin pour que suivre soit rentable.",
  },
  ev: {
    id: "ev",
    simple: "Gain moyen si tu suis",
    poker: "EV du call",
    tip: "Gain (ou perte) moyen estimé en jetons si tu suis, sur le long terme.",
  },
  spr: {
    id: "spr",
    simple: "Tapis / pot",
    poker: "SPR",
    tip: "Ton tapis effectif divisé par le pot. Un chiffre bas pousse souvent à t'engager.",
  },
  effectiveStack: {
    id: "effectiveStack",
    simple: "Jetons réellement en jeu entre vous",
    poker: "Tapis effectif",
    tip: "Le plus petit tapis entre toi et un adversaire encore en jeu — c'est ce qui compte vraiment.",
  },
  range: {
    id: "range",
    simple: "Mains possibles de l'adversaire",
    poker: "Range",
    tip: "Ensemble des mains qu'un adversaire pourrait encore avoir d'après ses actions.",
  },
  board: {
    id: "board",
    simple: "Cartes communes",
    poker: "Board",
    tip: "Les cartes au centre de la table, partagées par tous les joueurs.",
  },
  fold: {
    id: "fold",
    simple: "Se coucher",
    poker: "Fold",
    tip: "Abandonner la main et laisser le pot aux autres.",
  },
  check: {
    id: "check",
    simple: "Parole",
    poker: "Check",
    tip: "Ne rien miser quand personne n'a encore misé — passer la main au suivant.",
  },
  call: {
    id: "call",
    simple: "Suivre",
    poker: "Call",
    tip: "Payer le même montant que la dernière mise pour rester dans la main.",
  },
  bet: {
    id: "bet",
    simple: "Miser",
    poker: "Bet",
    tip: "Être le premier à mettre des jetons dans le pot sur ce tour.",
  },
  raise: {
    id: "raise",
    simple: "Relancer",
    poker: "Raise",
    tip: "Augmenter la mise déjà annoncée par un adversaire.",
  },
  allIn: {
    id: "allIn",
    simple: "Tapis",
    poker: "All-in",
    tip: "Miser tous tes jetons restants.",
  },
  preflop: {
    id: "preflop",
    simple: "Avant le flop",
    poker: "Préflop",
    tip: "Premier tour de mise, juste après avoir reçu tes deux cartes privées.",
  },
  flop: {
    id: "flop",
    simple: "Flop (3 cartes)",
    poker: "Flop",
    tip: "Les trois premières cartes communes sont révélées.",
  },
  turn: {
    id: "turn",
    simple: "Turn (4e carte)",
    poker: "Turn",
    tip: "La quatrième carte commune est révélée.",
  },
  river: {
    id: "river",
    simple: "River (5e carte)",
    poker: "River",
    tip: "La cinquième et dernière carte commune.",
  },
  showdown: {
    id: "showdown",
    simple: "Abattage des cartes",
    poker: "Showdown",
    tip: "Moment où les joueurs encore en jeu montrent leurs cartes pour départager.",
  },
  smallBlind: {
    id: "smallBlind",
    simple: "Petite mise obligatoire",
    poker: "Petite blind",
    tip: "Mise forcée du joueur juste après le donneur, avant de recevoir les cartes.",
  },
  bigBlind: {
    id: "bigBlind",
    simple: "Grosse mise obligatoire",
    poker: "Grosse blind",
    tip: "Mise forcée, en général le double de la petite, qui lance le pot.",
  },
  button: {
    id: "button",
    simple: "Donneur",
    poker: "Bouton",
    tip: "Repère du donneur : ce joueur parle en dernier après le flop (avantage de position).",
  },
  sidePot: {
    id: "sidePot",
    simple: "Pot secondaire",
    poker: "Side pot",
    tip: "Pot créé quand un joueur est à tapis pour un montant inférieur aux autres.",
  },
  kicker: {
    id: "kicker",
    simple: "Carte de départage",
    poker: "Kicker",
    tip: "Carte qui départage deux mains de même catégorie (ex. deux paires d'As).",
  },
  vpip: {
    id: "vpip",
    simple: "Mains jouées",
    poker: "VPIP",
    tip: "Pourcentage de mains où le joueur met volontairement de l'argent (hors blinds).",
  },
  pfr: {
    id: "pfr",
    simple: "Mains relancées avant le flop",
    poker: "PFR",
    tip: "Pourcentage de mains où le joueur relance avant le flop.",
  },
  styleTag: {
    id: "styleTag",
    simple: "Prudent et agressif",
    poker: "TAG",
    tip: "Joue peu de mains, mais les joue fort quand il s'y met.",
  },
  styleLag: {
    id: "styleLag",
    simple: "Large et agressif",
    poker: "LAG",
    tip: "Joue beaucoup de mains et met souvent la pression.",
  },
  styleTightPassive: {
    id: "styleTightPassive",
    simple: "Très prudent",
    poker: "Rock",
    tip: "Joue très peu de mains et relance rarement.",
  },
  styleLoosePassive: {
    id: "styleLoosePassive",
    simple: "Suit tout",
    poker: "Calling station",
    tip: "Suit souvent trop, se couche rarement.",
  },
  styleFish: {
    id: "styleFish",
    simple: "Imprévisible",
    poker: "Fish",
    tip: "Fait des erreurs de taille de mise et paie souvent trop.",
  },
} as const satisfies Record<string, TermEntry>;

export type WordingTermId = keyof typeof terms;

export const ui = {
  appTitle: "Poker Trainer",
  appTagline: (botCount: number) =>
    `Entraînez-vous au Texas Hold'em No-Limit contre ${botCount} adversaires, avec aides et conseils.`,
  newGame: "Nouvelle partie",
  restart: "Recommencer",
  rules: "Règles",
  settings: "Réglages",
  nextHand: "Main suivante",
  waitingBots: "En attente des autres joueurs…",
  oddsIdle: "Tes chances s'affichent pendant une main.",
  oddsTitle: "Aide à la décision",
  historyTitle: "Historique",
  copy: "Copier",
  coachTitle: "Conseil",
  playersInHand: (n: number) =>
    n <= 1 ? `${n} joueur en jeu` : `${n} joueurs en jeu`,
  handNumber: (n: number) => `Main n°${n}`,
  blindsPosted: (sb: string, bb: string) =>
    `Mises obligatoires ${sb} / ${bb}`,
  potLabel: (amount: string) => `Pot : ${amount}`,
  sidePotLabel: (index: number, amount: string) =>
    `Pot secondaire ${index} : ${amount}`,
  winsAmount: (amount: string) => `Gagne ${amount}`,
  winsWith: (names: string, amount: string, hand?: string) =>
    `${names} gagne ${amount}${hand ? ` (${hand})` : ""}`,
  startingHand: (cat: string) => `Main de départ : ${cat}`,
  vsOpponents: (n: number) =>
    n <= 1 ? `contre ${n} adversaire` : `contre ${n} adversaires`,
  outsCount: (n: number) => (n <= 1 ? `${n} carte` : `${n} cartes`),
  noCallNeeded: "Personne n'a misé : tu peux parler ou miser.",
  verdictGood: "Suivre est une bonne idée",
  verdictMarginal: "C'est limite",
  verdictBad: "Mieux vaut se coucher",
  verdictReasonGood: (toCall: string, potWin: string, equityPct: string) =>
    `Tu paies ${toCall} pour pouvoir gagner ${potWin}, et tu as ${equityPct} de chances : ça vaut le coup.`,
  verdictReasonMarginal: (toCall: string, potWin: string, equityPct: string) =>
    `Tu paies ${toCall} pour viser ${potWin}, avec ${equityPct} de chances : c'est tout juste.`,
  verdictReasonBad: (toCall: string, potWin: string, equityPct: string) =>
    `Tu paies ${toCall} pour viser ${potWin}, mais tu n'as que ${equityPct} de chances : trop cher.`,
  labelYourTurn: "À toi",
  labelTheirTurn: "À lui",
  youMarker: "Toi",
  youSuffix: "",
  labelFolded: "Couché",
  labelAllIn: "TAPIS",
  labelEliminated: "Éliminé",
  raiseTo: "Relancer à",
  betAmount: "Miser",
  halfPot: "½ pot",
  threeQuarterPot: "¾ pot",
  fullPot: "Pot",
  allInWith: (stack: string) => `Tapis (${stack})`,
  callAmount: (amount: string) => `Suivre ${amount}`,
  betAmountBtn: (amount: string) => `Miser ${amount}`,
  raiseAmountBtn: (amount: string) => `Relancer à ${amount}`,
  botCount: "Nombre d'adversaires",
  manualSeed: "Graine manuelle (optionnel)",
  manualSeedPlaceholder: "Aléatoire à chaque partie",
  gameSeed: (seed: string | number, manual: boolean) =>
    `Graine de la partie : ${seed}${manual ? " (manuelle)" : " (auto)"}`,
  showEquity: "Chances de gagner",
  showOuts: "Cartes qui aident",
  showPotOdds: "Prix pour suivre",
  showCoach: "Conseil",
  showLog: "Historique",
  revealStyles: "Afficher le niveau et le style des bots",
  revealStylesHint:
    "Désactivé, tu dois deviner leur profil grâce à leurs stats.",
  equityVsRange: (vsRange: string, vsRandom: string) =>
    `${vsRange} contre ses mains probables, ${vsRandom} contre une main au hasard`,
  fourColor: "Cartes 4 couleurs",
  theme: "Thème",
  themeDark: "Sombre",
  themeLight: "Clair",
  vocabMode: "Vocabulaire",
  vocabSimple: "Simple",
  vocabPoker: "Poker",
  actionFold: "se couche",
  actionCheck: "parole",
  actionCall: (amount: string) => `suit ${amount}`,
  actionBet: (amount: string) => `mise ${amount}`,
  actionRaise: (amount: string) => `relance à ${amount}`,
  actionAllIn: (amount: string) => `tapis ${amount}`,
  actionHeroFold: "Tu te couches",
  actionHeroCheck: "Tu parles",
  actionHeroCall: (amount: string) => `Tu suis ${amount}`,
  actionHeroBet: (amount: string) => `Tu mises ${amount}`,
  actionHeroRaise: (amount: string) => `Tu relances à ${amount}`,
  actionHeroAllIn: (amount: string) => `Tu mets le tapis (${amount})`,
  yourHand: (hand: string) => `Ta main : ${hand}`,
  chipsAmount: (amount: string) => `${amount} jetons`,
  stackPercentOf: (pct: string) => `${pct} de ton tapis`,
  moreDetails: "Plus de détails",
  zoneInfoTitle: "Mise sélectionnée",
  raiseToAmount: (amount: string) => `Relancer à ${amount}`,
  betToAmount: (amount: string) => `Miser ${amount}`,
  callAmountPct: (amount: string, pct: string) => `Suivre ${amount} (${pct})`,
  handPremium: "Très forte",
  handStrong: "Forte",
  handPlayable: "Jouable",
  handMarginal: "Faible",
  adviceNoBet: (equityPct: string) =>
    `Tes chances sont d'environ ${equityPct}. Personne n'a misé — tu peux parler ou miser.`,
  adviceGood: (outs: string, equityPct: string, requiredPct: string) =>
    `${outs}Tes chances : environ ${equityPct}. Il en faut ${requiredPct} pour que suivre vaille le coup — c'est bon.`,
  adviceCareful: (outs: string, equityPct: string, requiredPct: string) =>
    `${outs}Tes chances : ${equityPct}, il en faudrait ${requiredPct} — c'est limite.`,
  adviceBad: (outs: string, equityPct: string, requiredPct: string) =>
    `${outs}Tes chances : ${equityPct}, il en faudrait ${requiredPct} — mieux vaut se coucher.`,
  outsPart: (n: number, equityPct: string) =>
    n > 0
      ? `Tu as ${n} carte${n > 1 ? "s" : ""} qui peu${n > 1 ? "vent" : "t"} t'aider (environ ${equityPct}). `
      : "",
  reviewBad: "Choix probablement trop cher",
  reviewMarginal: "Choix limite",
  reviewGood: "Choix correct",
  styleLabel: (style: string, difficulty: string) => `${style} · ${difficulty}`,
} as const;

export function primaryLabel(entry: TermEntry, mode: VocabMode): string {
  return mode === "poker" ? entry.poker : entry.simple;
}

export function secondaryLabel(entry: TermEntry, mode: VocabMode): string {
  return mode === "poker" ? entry.simple : entry.poker;
}

export function styleWordingKey(
  style: string,
): WordingTermId | null {
  switch (style) {
    case "TAG":
      return "styleTag";
    case "LAG":
      return "styleLag";
    case "TIGHT_PASSIVE":
      return "styleTightPassive";
    case "LOOSE_PASSIVE":
      return "styleLoosePassive";
    case "FISH":
      return "styleFish";
    default:
      return null;
  }
}
