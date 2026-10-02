"use client";

import type { Card } from "@/engine";
import { PlayingCard, cardKey } from "@/ui/cards/PlayingCard";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type Props = {
  cards: (Card | null)[];
  revealed: boolean;
  handId: number;
  playerId: string;
};

/** Mini bot cards — positioned in layout box above seat plate. */
export function SeatBotCards({ cards, revealed, handId, playerId }: Props) {
  const reduce = useReducedMotion();

  return (
    <div className="flex h-full w-full items-end justify-center gap-0.5 pb-[18%]">
      <AnimatePresence mode="popLayout">
        {cards.map((card, i) => {
          const faceDown = !revealed;
          const ck = cardKey(card, faceDown);
          return (
            <motion.div
              key={`${handId}-${playerId}-${ck}-${i}`}
              initial={reduce ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.7 }}
              transition={{ duration: 0.2 }}
              className="relative"
              style={{ zIndex: i }}
            >
              <PlayingCard
                card={card}
                faceDown={faceDown}
                size={revealed ? "sm" : "xs"}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
