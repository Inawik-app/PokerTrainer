import type { AxisPoint, ProfileId } from "@/content/playerProfiles";
import { profilesSection } from "@/content/playerProfiles";
import { cn } from "@/lib/utils";

type Marker = {
  id: ProfileId;
  label: string;
  axis: AxisPoint;
  highlight?: boolean;
};

type Props = {
  markers: Marker[];
  className?: string;
  compact?: boolean;
};

/** 2-axis plot: prudent↔large (x), passif↔agressif (y). */
export function ProfileAxisChart({ markers, className, compact }: Props) {
  const size = compact ? 160 : 280;
  const pad = 28;
  const inner = size - pad * 2;

  return (
    <div className={cn("inline-block", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={profilesSection.axisTitle}
        className="rounded-lg border border-border bg-surface-2"
      >
        <line
          x1={pad}
          y1={size - pad}
          x2={size - pad}
          y2={size - pad}
          stroke="var(--border)"
          strokeWidth={1}
        />
        <line
          x1={pad}
          y1={pad}
          x2={pad}
          y2={size - pad}
          stroke="var(--border)"
          strokeWidth={1}
        />
        <line
          x1={pad}
          y1={size / 2}
          x2={size - pad}
          y2={size / 2}
          stroke="var(--border)"
          strokeWidth={0.5}
          strokeDasharray="4 4"
        />
        <line
          x1={size / 2}
          y1={pad}
          x2={size / 2}
          y2={size - pad}
          stroke="var(--border)"
          strokeWidth={0.5}
          strokeDasharray="4 4"
        />

        <text
          x={size / 2}
          y={size - 6}
          textAnchor="middle"
          className="fill-text-muted"
          fontSize={10}
        >
          {profilesSection.axisLooseLow} ← → {profilesSection.axisLooseHigh}
        </text>
        <text
          x={12}
          y={size / 2}
          textAnchor="middle"
          className="fill-text-muted"
          fontSize={10}
          transform={`rotate(-90 12 ${size / 2})`}
        >
          {profilesSection.axisAggLow} ← → {profilesSection.axisAggHigh}
        </text>

        {markers.map((m) => {
          const cx = pad + m.axis.loose * inner;
          const cy = size - pad - m.axis.aggressive * inner;
          return (
            <g key={m.id}>
              <circle
                cx={cx}
                cy={cy}
                r={m.highlight ? 8 : 6}
                fill="var(--gold)"
                opacity={m.highlight ? 1 : 0.75}
                stroke="var(--surface)"
                strokeWidth={2}
              />
              <text
                x={cx}
                y={cy - 10}
                textAnchor="middle"
                className="fill-text"
                fontSize={compact ? 9 : 11}
                fontWeight={600}
              >
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
