"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChipStack } from "@/ui/cards/ChipStack";
import { formatChips } from "@/lib/format";

type Props = {
  amount: number;
};

/** Street bet: large chips + bold amount pill (table layout). */
export function TableBet({ amount }: Props) {
  const reduce = useReducedMotion();
  if (amount <= 0) return null;

  return (
    <motion.div
      className="flex h-full w-full items-center justify-center gap-2"
      initial={reduce ? false : { opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
    >
      <ChipStack amount={amount} size="lg" showLabel={false} animateIn={false} />
      <span
        className="rounded-full px-2.5 py-1 text-base font-bold tabular-nums shadow-card"
        style={{
          background: "var(--chip-label-bg)",
          color: "var(--chip-label-text)",
          fontSize: "max(16px, 1rem)",
        }}
      >
        {formatChips(amount)}
      </span>
    </motion.div>
  );
}
