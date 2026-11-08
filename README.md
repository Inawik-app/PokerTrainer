# Poker Trainer

Simulateur de Texas Hold'em No-Limit pour apprendre le poker. Le joueur affronte de 1 à 5 bots et voit en direct ses probabilités de gagner, la cote du pot et des conseils sur chaque décision.

Tout tourne dans le navigateur : pas de backend, pas de base de données.

## Ce que fait l'application

- **Partie complète** : blinds, tours d'enchères, tapis et pots secondaires, abattage.
- **Bots** avec plusieurs profils de joueur et niveaux de difficulté. Ils ne voient que ce qu'un vrai joueur verrait : jamais les cartes des autres.
- **Coach** : équité de la main face à la fourchette estimée de l'adversaire, zones de mise conseillées, relecture de la main une fois terminée.
- **Mains rejouables** : tout l'aléatoire passe par un générateur à graine, donc une main peut être rejouée à l'identique.
- Page de règles et glossaire pour les débutants.

## Architecture

Les dépendances vont dans un seul sens, ce qui garde le cœur du jeu indépendant de l'interface :

```
engine  →  odds  →  bots / coach  →  store  →  ui
```

| Dossier | Rôle |
| --- | --- |
| `src/engine` | Règles du poker en fonctions pures `(état, action) => état`. Aucun import React. |
| `src/odds` | Calcul des probabilités. |
| `src/bots` | Décisions des bots à partir de la vue du joueur. |
| `src/coach` | Estimation des fourchettes adverses et conseils. |
| `src/store` | État global (Zustand), seul endroit avec des effets de bord. |
| `src/ui` | Composants React, sans aucune règle de poker. |

Le moteur, les probabilités et les bots sont couverts par des tests Vitest.

## Stack

Next.js (App Router) · TypeScript strict · Tailwind CSS · shadcn/ui · Framer Motion · Zustand · Vitest · Vercel

## Lancer le projet

```bash
npm install
npm run dev     # http://localhost:3000
npm test
npm run build
```
