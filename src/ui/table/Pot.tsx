"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChipStack } from "@/ui/cards/ChipStack";
import { formatChips } from "@/lib/format";
import { ui } from "@/content/wording";

type PotEntry = { amount: number; label: string };

type Props = {
  amount: number;
  pots?: PotEntry[];
};

export function Pot({ amount, pots }: Props) {
  const reduce = useReducedMotion();
  const entries =
    pots && pots.length > 0
      ? pots
      : amount > 0
        ? [{ amount, label: ui.potLabel(formatChips(amount)) }]
        : [];

  if (entries.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <span>{ui.potLabel("0")}</span>
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-wrap items-center justify-center gap-3"
      layout
      initial={reduce ? false : { scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      {entries.map((p, i) => (
        <div key={`${p.label}-${i}`} className="flex items-center gap-2">
          <ChipStack
            amount={p.amount}
            size={entries.length > 1 ? "sm" : "md"}
            showLabel={false}
          />
          <span className="whitespace-nowrap text-sm font-semibold text-text">
            {p.label}
          </span>
        </div>
      ))}
    </motion.div>
  );
}
