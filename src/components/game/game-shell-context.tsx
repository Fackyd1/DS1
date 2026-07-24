"use client";

import { createContext, useContext, useMemo, useState } from "react";

type GameShellContextValue = {
  isPlaying: boolean;
  isPaused: boolean;
  isMenuOpen: boolean;
  startGame: () => void;
  closeGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  setMenuOpen: (open: boolean) => void;
};

const GameShellContext = createContext<GameShellContextValue | null>(null);

export function GameShellProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const value = useMemo<GameShellContextValue>(
    () => ({
      isPlaying,
      isPaused,
      isMenuOpen,
      startGame: () => {
        setIsPlaying(true);
        setIsPaused(false);
      },
      closeGame: () => {
        setIsPlaying(false);
        setIsPaused(false);
        setIsMenuOpen(false);
      },
      pauseGame: () => {
        if (isPlaying) {
          setIsPaused(true);
        }
      },
      resumeGame: () => {
        if (isPlaying) {
          setIsPaused(false);
        }
      },
      setMenuOpen: (open: boolean) => {
        setIsMenuOpen(open);
        if (open && isPlaying) {
          setIsPaused(true);
        }
      },
    }),
    [isMenuOpen, isPaused, isPlaying]
  );

  return <GameShellContext.Provider value={value}>{children}</GameShellContext.Provider>;
}

export function useGameShell() {
  const context = useContext(GameShellContext);

  if (!context) {
    throw new Error("useGameShell must be used within a GameShellProvider");
  }

  return context;
}