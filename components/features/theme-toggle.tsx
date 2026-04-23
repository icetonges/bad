'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from './theme-provider'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={`inline-flex items-center justify-center h-8 w-8 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition ${className ?? ''}`}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
