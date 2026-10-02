"use client";

import { useId } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatChips } from "@/lib/format";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type MarkerKind = "dealer" | "sb" | "bb";

type Props = {
  kind: MarkerKind;
  amount?: number;
  className?: string;
};

const TIPS: Record<MarkerKind, (amount: number) => string> = {
  dealer: () =>
    "Donneur : parle en dernier après le flop (avantage de position).",
  sb: (a) =>
    `Petite blinde : mise obligatoire de ${formatChips(a)} avant de voir ses cartes.`,
  bb: (a) =>
    `Grosse blinde : mise obligatoire de ${formatChips(a)} avant de voir ses cartes.`,
};

export function TableMarker({ kind, amount = 0, className }: Props) {
  const id = useId();
  const reduce = useReducedMotion();
  const size = kind === "dealer" ? 36 : 30;
  const fill =
    kind === "dealer"
      ? "var(--marker-dealer-bg)"
      : kind === "sb"
        ? "var(--marker-sb-bg)"
        : "var(--marker-bb-bg)";
  const ink =
    kind === "dealer"
      ? "var(--marker-dealer-ink)"
      : kind === "sb"
        ? "var(--marker-sb-ink)"
        : "var(--marker-bb-ink)";
  const label = kind === "dealer" ? "D" : kind === "sb" ? "PB" : "GB";
  const extraH = kind === "dealer" ? 0 : 14;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <motion.span
            layoutId={kind === "dealer" ? "dealer-button" : undefined}
            className={cn("inline-flex cursor-help", className)}
            transition={
              reduce
                ? { duration: 0 }
                : { type: "spring", stiffness: 280, damping: 26 }
            }
          />
        }
      >
        <svg
          width={size}
          height={size + extraH}
          viewBox={`0 0 ${size} ${size + extraH}`}
          aria-label={TIPS[kind](amount)}
          role="img"
        >
          <defs>
            <radialGradient id={`${id}-g`} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="var(--chip-highlight)" />
              <stop offset="100%" stopColor={fill} />
            </radialGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 1}
            fill={`url(#${id}-g)`}
            stroke="var(--chip-edge)"
            strokeWidth={kind === "dealer" ? 2.5 : 1.5}
          />
          <text
            x={size / 2}
            y={size / 2 + 4}
            textAnchor="middle"
            fontSize={kind === "dealer" ? 14 : 9}
            fontWeight={800}
            fill={ink}
          >
            {label}
          </text>
          {kind !== "dealer" && (
            <text
              x={size / 2}
              y={size + 10}
              textAnchor="middle"
              fontSize={8}
              fontWeight={600}
              fill="var(--text)"
            >
              {formatChips(amount)}
            </text>
          )}
        </svg>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-sm">
        {TIPS[kind](amount)}
      </TooltipContent>
    </Tooltip>
  );
}
