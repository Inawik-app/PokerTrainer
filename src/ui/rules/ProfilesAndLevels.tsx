import {
  playerProfiles,
  playerStatExplainers,
  profilesSection,
  statsReliabilityNote,
} from "@/content/playerProfiles";
import { botLevelCards, botLevelsSection, botLevelSummary } from "@/content/botLevels";
import { ProfileAxisChart } from "@/ui/rules/ProfileAxisChart";

export function PlayerProfilesSection() {
  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-text">{profilesSection.title}</h2>
        <p className="text-text-muted">{profilesSection.intro}</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-text">
          {profilesSection.statsTitle}
        </h3>
        <ul className="space-y-4">
          {playerStatExplainers.map((s) => (
            <li key={s.key} className="space-y-1">
              <p className="font-medium text-text">
                {s.simple}{" "}
                <span className="text-xs font-normal text-text-muted">
                  ({s.poker})
                </span>
              </p>
              <p className="text-sm text-text-muted">{s.sentence}</p>
              <p className="text-sm text-text-muted italic">{s.example}</p>
            </li>
          ))}
        </ul>
        <p className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-muted">
          {statsReliabilityNote}
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-text">
          {profilesSection.axisTitle}
        </h3>
        <ProfileAxisChart
          markers={playerProfiles.map((p) => ({
            id: p.id,
            label: p.pokerName,
            axis: p.axis,
          }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-1">
        {playerProfiles.map((p) => (
          <article
            key={p.id}
            className="space-y-3 rounded-xl border border-border bg-surface-2 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-text">
                  {p.simpleName}{" "}
                  <span className="text-sm font-normal text-text-muted">
                    ({p.pokerName})
                  </span>
                </h3>
                {p.description.map((d) => (
                  <p key={d} className="mt-1 text-sm text-text-muted">
                    {d}
                  </p>
                ))}
              </div>
              <ProfileAxisChart
                compact
                markers={[
                  {
                    id: p.id,
                    label: p.pokerName,
                    axis: p.axis,
                    highlight: true,
                  },
                ]}
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                {profilesSection.typicalStatsLabel}
              </p>
              <ul className="mt-1 grid gap-1 text-sm text-text sm:grid-cols-3">
                <li>
                  {profilesSection.vpipShort} : {p.typicalStats.vpip}
                </li>
                <li>
                  {profilesSection.pfrShort} : {p.typicalStats.pfr}
                </li>
                <li>
                  {profilesSection.afShort} : {p.typicalStats.aggression}
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                {profilesSection.howToSpotLabel}
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-text-muted">
                {p.howToSpot.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                {profilesSection.howToPlayLabel}
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-text-muted">
                {p.howToPlay.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function BotLevelsSection() {
  const levelCards = botLevelCards.filter((c) =>
    ["all_easy", "all_medium", "all_hard", "mixed"].includes(c.id),
  );

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-text">{botLevelsSection.title}</h2>
        <p className="text-text-muted">{botLevelsSection.intro}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {levelCards.map((card) => (
          <div
            key={card.id}
            className="rounded-lg border border-border bg-surface-2 p-3"
          >
            <p className="font-semibold text-text">{card.title}</p>
            {card.body.map((line) => (
              <p key={line} className="mt-1 text-sm text-text-muted">
                {line}
              </p>
            ))}
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-2 text-lg font-semibold text-text">
          {botLevelsSection.summaryTitle}
        </h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-text-muted">
                <th className="px-3 py-2 font-medium">Niveau</th>
                <th className="px-3 py-2 font-medium">
                  {botLevelsSection.summaryConsiders}
                </th>
                <th className="px-3 py-2 font-medium">
                  {botLevelsSection.summaryErrors}
                </th>
              </tr>
            </thead>
            <tbody>
              {botLevelSummary.map((row) => (
                <tr key={row.level} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-medium text-text">{row.level}</td>
                  <td className="px-3 py-2 text-text-muted">{row.considers}</td>
                  <td className="px-3 py-2 text-text-muted">{row.errorRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-text">
          {botLevelsSection.styleTitle}
        </h3>
        <p className="text-sm text-text-muted">{botLevelsSection.styleIntro}</p>
      </div>
    </section>
  );
}
