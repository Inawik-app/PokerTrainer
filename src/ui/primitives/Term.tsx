"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  primaryLabel,
  secondaryLabel,
  terms,
  type WordingTermId,
} from "@/content/wording";
import { useVocab } from "@/ui/hooks/useVocab";
import { cn } from "@/lib/utils";

type Props = {
  id: WordingTermId;
  /** Override displayed primary text. */
  children?: React.ReactNode;
  className?: string;
  /** Show secondary technical/simple label underneath. */
  showSecondary?: boolean;
};

/**
 * In "simple" mode: beginner label on top, poker term small below.
 * In "poker" mode: poker term on top, simple gloss below.
 */
export function Term({
  id,
  children,
  className,
  showSecondary = true,
}: Props) {
  const { mode } = useVocab();
  const entry = terms[id];
  const primary = children ?? primaryLabel(entry, mode);
  const secondary = secondaryLabel(entry, mode);

  return (
    <span className={cn("inline-flex flex-col items-start gap-0", className)}>
      <span className="text-sm font-medium leading-snug text-text">{primary}</span>
      {showSecondary && (
        <Tooltip>
          <TooltipTrigger className="cursor-help border-b border-dotted border-text-muted text-[10px] leading-tight text-text-muted">
            {secondary}
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-sm">
            <strong>{entry.poker}</strong> — {entry.tip}
          </TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}

/** Inline term used as a single underlined word (no secondary line). */
export function TermInline({
  id,
  children,
}: {
  id: WordingTermId;
  children?: React.ReactNode;
}) {
  const { mode } = useVocab();
  const entry = terms[id];
  return (
    <Tooltip>
      <TooltipTrigger className="cursor-help border-b border-dotted border-text-muted">
        {children ?? primaryLabel(entry, mode)}
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-sm">
        <strong>{entry.poker}</strong> — {entry.tip}
      </TooltipContent>
    </Tooltip>
  );
}
