import type { Metadata, Viewport } from 'next'

import { CookieConsent } from '@/components/atoms/cookie-consent'
import { DINGRY_APPLE_ICON_URL, DINGRY_FAVICON_URL } from '@/lib/dingry-brand'

import { DINGRY_META_DESCRIPTION } from '@/lib/dingry-brand-voice'

import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://www.dingry.com'

export const metadata: Metadata = {
  title: 'DINGRY — True Luxury Is Attitude',
  description: DINGRY_META_DESCRIPTION,
  metadataBase: new URL(siteUrl),
  alternates: { canonical: '/' },
  openGraph: {
    title: 'DINGRY — True Luxury Is Attitude',
    description: DINGRY_META_DESCRIPTION,
    url: '/',
    siteName: 'DINGRY',
    locale: 'fr_FR',
    type: 'website',
  },
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
    <html lang="fr" data-theme="light" className="overflow-x-hidden">
      <body className="overflow-x-hidden antialiased">
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
