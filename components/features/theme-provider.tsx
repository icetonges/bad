'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyThemeClass(t: Theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (t === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with 'dark' to match the no-flash script default; useEffect syncs from storage.
  const [theme, setThemeState] = useState<Theme>('dark')

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    const initial: Theme = stored === 'light' ? 'light' : 'dark'
    setThemeState(initial)
    applyThemeClass(initial)
  }, [])

  function setTheme(t: Theme) {
    setThemeState(t)
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', t)
      applyThemeClass(t)
    }
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
