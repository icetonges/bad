import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/features/theme-provider'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'FedFMMatter — AI for federal financial management',
  description: 'Budget, audit, accounting and contracts analysis for federal government professionals.',
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
}

// Inline script prevents theme flash on first paint.
// Dark is the DEFAULT — we add the .dark class unless user has explicitly chosen light.
const noFlashScript = `
(function() {
  try {
    var t = localStorage.getItem('theme');
    if (t !== 'light') document.documentElement.classList.add('dark');
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-background`}>
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
