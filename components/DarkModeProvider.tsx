'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DarkModeCtx {
  isDark: boolean;
  toggle: () => void;
}

const Ctx = createContext<DarkModeCtx>({ isDark: false, toggle: () => {} });

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Sync state with what the anti-flash script already applied
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch { /* */ }
  }

  return <Ctx.Provider value={{ isDark, toggle }}>{children}</Ctx.Provider>;
}

export const useDarkMode = () => useContext(Ctx);
