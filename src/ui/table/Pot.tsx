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

  if (entries.length === 0) return null;

  return (
    <motion.div
      className="flex flex-wrap items-end justify-center gap-4"
      layout
      initial={reduce ? false : { scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      {entries.map((p, i) => (
        <ChipStack
          key={`${p.label}-${i}`}
          amount={p.amount}
          size={entries.length > 1 ? "md" : "lg"}
          label={p.label}
        />
      ))}
    </motion.div>
  );
}
