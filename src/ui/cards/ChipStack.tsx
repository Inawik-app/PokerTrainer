"use client";

import { useId } from "react";
import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { formatChips } from "@/lib/format";
import { cn } from "@/lib/utils";

const DENOMS = [5000, 1000, 500, 100, 25, 5, 1] as const;

const COLOR_VAR: Record<(typeof DENOMS)[number], string> = {
  5000: "var(--chip-5000)",
  1000: "var(--chip-1000)",
  500: "var(--chip-500)",
  100: "var(--chip-100)",
  25: "var(--chip-25)",
  5: "var(--chip-5)",
  1: "var(--chip-1)",
};

const MAX_PER_COLUMN = 8;
const STACK_OFFSET = 3.5;

export function decomposeChips(
  amount: number,
): { value: (typeof DENOMS)[number]; count: number }[] {
  let remaining = Math.max(0, Math.floor(amount));
  const parts: { value: (typeof DENOMS)[number]; count: number }[] = [];
  for (const d of DENOMS) {
    const count = Math.floor(remaining / d);
    if (count > 0) {
      parts.push({ value: d, count });
      remaining -= count * d;
    }
  }
  return parts;
}

type Props = {
  amount: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  /** When false, no amount pill under the chips. */
  showLabel?: boolean;
  className?: string;
  animateIn?: boolean;
};

export function ChipStack({
  amount,
  size = "md",
  label,
  showLabel = true,
  className,
  animateIn = true,
}: Props) {
  const reduce = useReducedMotion();
  if (amount <= 0) return null;

  const parts = decomposeChips(amount);
  const chipPx = size === "lg" ? 28 : size === "sm" ? 18 : 22;
  const labelText = label ?? formatChips(amount);

  return (
    <motion.div
      className={cn("flex flex-col items-center gap-1", className)}
      initial={animateIn && !reduce ? { y: -12, opacity: 0 } : false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      layout
    >
      <div className="flex items-end gap-1">
        {parts.map(({ value, count }) => {
          const columns: number[] = [];
          let left = count;
          while (left > 0) {
            columns.push(Math.min(MAX_PER_COLUMN, left));
            left -= MAX_PER_COLUMN;
          }
          return columns.map((colCount, colIdx) => (
            <div
              key={`${value}-${colIdx}`}
              className="relative"
              style={{
                width: chipPx,
                height: chipPx + (colCount - 1) * STACK_OFFSET,
              }}
            >
              {Array.from({ length: colCount }).map((_, i) => (
                <ChipDisc
                  key={i}
                  value={value}
                  size={chipPx}
                  style={{
                    bottom: i * STACK_OFFSET,
                    zIndex: i,
                  }}
                />
              ))}
            </div>
          ));
        })}
      </div>
      {showLabel && (
        <div
          className="rounded-full px-2.5 py-0.5 font-display text-[14px] font-semibold tabular-nums tracking-tight shadow-card"
          style={{
            background: "var(--chip-label-bg)",
            color: "var(--chip-label-text)",
          }}
        >
          {labelText}
        </div>
      )}
    </motion.div>
  );
}

function ChipDisc({
  value,
  size,
  style,
}: {
  value: (typeof DENOMS)[number];
  size: number;
  style: CSSProperties;
}) {
  const reactId = useId();
  const fill = COLOR_VAR[value];
  const gradId = `${reactId}-lit`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className="absolute left-0"
      style={{ ...style, filter: "drop-shadow(var(--chip-shadow))" }}
      aria-hidden
    >
      <defs>
        <radialGradient id={gradId} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="var(--chip-highlight)" />
          <stop offset="55%" stopColor={fill} />
          <stop offset="100%" stopColor={fill} />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill={`url(#${gradId})`} />
      <circle
        cx="20"
        cy="20"
        r="19"
        fill="none"
        stroke="var(--chip-edge)"
        strokeWidth="1.5"
      />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * Math.PI * 2) / 12;
        const x1 = 20 + Math.cos(a) * 15.5;
        const y1 = 20 + Math.sin(a) * 15.5;
        const x2 = 20 + Math.cos(a) * 19;
        const y2 = 20 + Math.sin(a) * 19;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--chip-edge)"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity={0.55}
          />
        );
      })}
      <circle
        cx="20"
        cy="20"
        r="11"
        fill="none"
        stroke="var(--chip-edge)"
        strokeWidth="1.2"
        opacity={0.7}
      />
      <circle
        cx="20"
        cy="20"
        r="8.5"
        fill={fill}
        stroke="var(--chip-highlight)"
        strokeWidth="0.8"
        opacity={0.95}
      />
      <text
        x="20"
        y="23"
        textAnchor="middle"
        fontSize="7"
        fontWeight="700"
        fill="var(--chip-label-text)"
        opacity={0.85}
      >
        {value >= 1000 ? `${value / 1000}k` : value}
      </text>
    </svg>
  );
}
