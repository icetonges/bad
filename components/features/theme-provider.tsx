'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    const initial: Theme = stored === 'light' ? 'light' : 'dark'
    setThemeState(initial)
    document.documentElement.classList.toggle('dark', initial === 'dark')
  }, [])

  function setTheme(t: Theme) {
    setThemeState(t)
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', t)
      document.documentElement.classList.toggle('dark', t === 'dark')
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
