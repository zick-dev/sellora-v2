'use client';

/**
 * lib/theme.tsx
 * ──────────────
 * Dark/Light theme system for Sellora dashboard.
 *
 * Usage in any page:
 *   import { useTheme } from '@/lib/theme';
 *   const { C, theme, toggleTheme } = useTheme();
 *   // then use C.text, C.card etc just like the old hardcoded palette
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export const DARK = {
  bg:           '#0d0d14',
  card:         '#13131f',
  cardBorder:   '#1e1e30',
  sidebar:      '#0a0a12',
  sidebarBorder:'#1a1a2e',
  input:        '#1a1a2e',
  inputBorder:  '#2a2a3e',
  purple:       '#7c3aed',
  purpleLight:  '#8b5cf6',
  purpleHov:    '#6d28d9',
  purpleDim:    'rgba(124,58,237,0.12)',
  mutedLight:   '#9ca3af',
  orange:       '#f59e0b',
  topbar:       '#0a0a12',
  inputFocus:   '#7c3aed',
  pink:         '#ec4899',
  success:      '#10b981',
  amber:        '#f59e0b',
  red:          '#ef4444',
  teal:         '#06b6d4',
  blue:         '#3b82f6',
  green:        '#25d366',
  muted:        '#6b7280',
  subtext:      '#c4c4d4',
  text:         '#ffffff',
  purpleHov:    '#6d28d9',
  purpleDim:    'rgba(124,58,237,0.12)',
  mutedLight:   '#9ca3af',
  orange:       '#f59e0b',
  topbar:       '#0a0a12',
};

export const LIGHT = {
  bg:           '#f5f5fa',
  card:         '#ffffff',
  cardBorder:   'rgba(0,0,0,0.08)',
  sidebar:      '#ffffff',
  sidebarBorder:'#e8e8f0',
  input:        '#f1f1f7',
  inputBorder:  'rgba(0,0,0,0.12)',
  purple:       '#7c3aed',
  purpleLight:  '#6d28d9',
  purpleHov:    '#5b21b6',
  purpleDim:    'rgba(124,58,237,0.08)',
  mutedLight:   '#6b7280',
  orange:       '#d97706',
  topbar:       '#ffffff',
  inputFocus:   '#7c3aed',
  pink:         '#db2777',
  success:      '#059669',
  amber:        '#d97706',
  red:          '#dc2626',
  teal:         '#0891b2',
  blue:         '#2563eb',
  green:        '#16a34a',
  muted:        '#9ca3af',
  subtext:      '#4b5563',
  text:         '#111827',
  purpleHov:    '#6d28d9',
  purpleDim:    'rgba(124,58,237,0.08)',
  mutedLight:   '#9ca3af',
  orange:       '#d97706',
  topbar:       '#ffffff',
};

export type Palette = typeof DARK;
type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  C: Palette;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  C: DARK,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('sellora_theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') {
      setThemeState(saved);
    }
  }, []);

  useEffect(() => {
    document.body.style.background = theme === 'dark' ? DARK.bg : LIGHT.bg;
    document.body.style.color = theme === 'dark' ? DARK.text : LIGHT.text;
    document.body.style.colorScheme = theme;
  }, [theme]);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem('sellora_theme', t);
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  return (
    <ThemeContext.Provider value={{ theme, C: theme === 'dark' ? DARK : LIGHT, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
