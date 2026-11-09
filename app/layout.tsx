import type { Metadata, Viewport } from 'next'

import { AdminSwitcherBarLazy } from '@/components/molecules/admin-switcher-bar-lazy'
import { CookieConsentLazy } from '@/components/atoms/cookie-consent-lazy'
import { DINGRY_APPLE_ICON_URL, DINGRY_FAVICON_URL, DINGRY_OPEN_GRAPH_IMAGE } from '@/lib/dingry-brand'
import { anton } from '@/lib/dingry-fonts'
import { DINGRY_META_DESCRIPTION } from '@/lib/dingry-brand-voice'
import { getSiteUrl } from '@/lib/site-url'
import './globals.css'

export const metadata: Metadata = {
  title: 'DINGRY — True Luxury Is Attitude',
  description: DINGRY_META_DESCRIPTION,
  metadataBase: getSiteUrl(),
  alternates: { canonical: '/' },
  openGraph: {
    title: 'DINGRY — True Luxury Is Attitude',
    description: DINGRY_META_DESCRIPTION,
    url: '/',
    siteName: 'DINGRY',
    locale: 'fr_FR',
    type: 'website',
    images: [DINGRY_OPEN_GRAPH_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DINGRY — True Luxury Is Attitude',
    description: DINGRY_META_DESCRIPTION,
    images: [DINGRY_OPEN_GRAPH_IMAGE.url],
  },
  icons: {
    icon: { url: DINGRY_FAVICON_URL, type: 'image/jpeg' },
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
    <html lang="fr" data-theme="light" className={`${anton.variable} overflow-x-hidden`}>
      <body className="overflow-x-hidden antialiased">
        {children}
        <AdminSwitcherBarLazy />
        <CookieConsentLazy />
      </body>
    </html>
  )
}
