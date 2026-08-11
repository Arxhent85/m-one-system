import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'M ONE ERP',
    template: '%s | M ONE ERP',
  },
  description: 'Warenwirtschafts- und Vertriebssystem — Multi-Standort Lagerhaltung & Verkauf',
  manifest: '/manifest.json',
  keywords: ['ERP', 'Warenwirtschaft', 'Lager', 'Inventar', 'Verkauf'],
  authors: [{ name: 'M ONE' }],
  robots: 'noindex, nofollow', // Interne App — nicht indexieren
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'M ONE ERP',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="bg-surface-950 text-surface-100 antialiased">
        {children}
      </body>
    </html>
  )
}
