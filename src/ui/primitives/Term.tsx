"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { glossary, type GlossaryId } from "@/content/glossary";

type Props = {
  id: GlossaryId;
  children: React.ReactNode;
};

export function Term({ id, children }: Props) {
  const entry = glossary[id];
  return (
    <Tooltip>
      <TooltipTrigger className="cursor-help border-b border-dotted border-text-muted">
        {children}
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-sm">
        <strong>{entry.term}</strong> — {entry.definition}
      </TooltipContent>
    </Tooltip>
  );
}
