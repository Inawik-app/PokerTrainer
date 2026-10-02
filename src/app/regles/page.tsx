import { PlayingCard } from "@/ui/cards/PlayingCard";
import { parseCard } from "@/engine/cards";
import { glossary } from "@/content/glossary";
import {
  BotLevelsSection,
  PlayerProfilesSection,
} from "@/ui/rules/ProfilesAndLevels";
import Link from "next/link";

const COMBOS: { name: string; cards: string[] }[] = [
  { name: "Quinte flush royale", cards: ["As", "Ks", "Qs", "Js", "Ts"] },
  { name: "Quinte flush", cards: ["9h", "8h", "7h", "6h", "5h"] },
  { name: "Carré", cards: ["Ah", "Ad", "Ac", "As", "2h"] },
  { name: "Full", cards: ["Kh", "Kd", "Kc", "2s", "2h"] },
  { name: "Couleur", cards: ["Ah", "Jh", "9h", "5h", "2h"] },
  { name: "Quinte", cards: ["9c", "8d", "7h", "6s", "5c"] },
  { name: "Brelan", cards: ["Qh", "Qd", "Qc", "9s", "2h"] },
  { name: "Double paire", cards: ["Jh", "Jd", "8c", "8s", "3h"] },
  { name: "Paire", cards: ["Th", "Td", "Ac", "9s", "2h"] },
  { name: "Carte haute", cards: ["Ah", "Kd", "Qc", "9s", "2h"] },
];

export default function ReglesPage() {
  return (
    <main className="mx-auto max-w-3xl flex-1 space-y-12 bg-surface px-6 py-10 text-text">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Règles</h1>
        <Link href="/" className="text-sm text-gold underline">
          Retour au jeu
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Déroulé d&apos;une main</h2>
        <ol className="list-decimal space-y-2 pl-5 text-text-muted">
          <li>Les blinds sont postées (petite et grosse blind).</li>
          <li>Chaque joueur reçoit 2 cartes cachées — tour de mise préflop.</li>
          <li>Flop : 3 cartes communes, puis tour de mise.</li>
          <li>Turn : 1 carte, tour de mise.</li>
          <li>River : 1 carte, dernier tour de mise.</li>
          <li>Showdown : la meilleure main de 5 cartes gagne le pot.</li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Classement des mains</h2>
        <div className="space-y-3">
          {COMBOS.map((c) => (
            <div key={c.name} className="flex flex-wrap items-center gap-3">
              <div className="flex gap-1">
                {c.cards.map((code) => (
                  <PlayingCard key={code} card={parseCard(code)} size="sm" />
                ))}
              </div>
              <span className="font-medium">{c.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Les maths en 2 minutes</h2>
        <ul className="space-y-2 text-text-muted">
          <li>
            <strong className="text-text">Outs</strong> : cartes qui vous
            améliorent. Règle du 2 et du 4 : outs×4 ≈ % au flop, outs×2 au turn.
          </li>
          <li>
            <strong className="text-text">Cote du pot</strong> : mise à payer /
            (pot + mise). Si votre équité est supérieure, suivre est rentable.
          </li>
          <li>
            <strong className="text-text">SPR</strong> : tapis effectif / pot.
            SPR bas = souvent « tout rentrer » avec une bonne main.
          </li>
        </ul>
      </section>

      <PlayerProfilesSection />

      <BotLevelsSection />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Glossaire</h2>
        <dl className="space-y-3">
          {Object.values(glossary).map((g) => (
            <div key={g.term}>
              <dt className="font-medium text-text">{g.term}</dt>
              <dd className="text-text-muted">{g.definition}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
