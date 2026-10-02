"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { VocabMode } from "@/content/wording";

const STORAGE_KEY = "poker-trainer-settings";
const EVENT = "poker-aids";

type Aids = {
  vocabMode: VocabMode;
  [key: string]: unknown;
};

type VocabContextValue = {
  mode: VocabMode;
  setMode: (mode: VocabMode) => void;
};

const VocabContext = createContext<VocabContextValue>({
  mode: "simple",
  setMode: () => undefined,
});

function readMode(): VocabMode {
  if (typeof window === "undefined") return "simple";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return "simple";
    const parsed = JSON.parse(raw) as Aids;
    return parsed.vocabMode === "poker" ? "poker" : "simple";
  } catch {
    return "simple";
  }
}

export function VocabProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<VocabMode>("simple");

  useEffect(() => {
    setModeState(readMode());
    const onAids = (e: Event) => {
      const detail = (e as CustomEvent<Aids>).detail;
      if (detail?.vocabMode === "poker" || detail?.vocabMode === "simple") {
        setModeState(detail.vocabMode);
      }
    };
    window.addEventListener(EVENT, onAids);
    return () => window.removeEventListener(EVENT, onAids);
  }, []);

  const setMode = useCallback((next: VocabMode) => {
    setModeState(next);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const prev = raw ? (JSON.parse(raw) as Aids) : {};
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...prev, vocabMode: next }),
      );
    } catch {
      /* ignore */
    }
    window.dispatchEvent(
      new CustomEvent(EVENT, { detail: { vocabMode: next } }),
    );
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);
  return createElement(VocabContext.Provider, { value }, children);
}

export function useVocab(): VocabContextValue {
  return useContext(VocabContext);
}
