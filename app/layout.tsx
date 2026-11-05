import type { Metadata, Viewport } from 'next'

import { CookieConsent } from '@/components/cookie-consent'
import { DINGRY_APPLE_ICON_URL, DINGRY_FAVICON_URL } from '@/lib/dingry-brand'

import { DINGRY_META_DESCRIPTION } from '@/lib/dingry-brand-voice'

import './globals.css'

export const metadata: Metadata = {
  title: 'DINGRY — True Luxury Is Attitude',
  description: DINGRY_META_DESCRIPTION,
  generator: 'v0.app',
  icons: {
    icon: { url: DINGRY_FAVICON_URL, type: 'image/png' },
    apple: DINGRY_APPLE_ICON_URL,
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" data-theme="light">
      <body className="antialiased">
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
