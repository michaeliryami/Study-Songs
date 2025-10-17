import type { Metadata } from 'next'
import { Providers } from './providers'
import './styles/globals.css'
import Navbar from './components/Navbar'

export const metadata: Metadata = {
  title: 'Noomo AI - Memorable Learning Jingles',
  description: 'Turn study notes into unforgettable mnemonic devices',
  icons: {
    icon: [
      { url: '/favicon-256x256.png', sizes: '256x256', type: 'image/png' },
      { url: '/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon-128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon-64x64.png', sizes: '64x64', type: 'image/png' },
      { url: '/logo.png', sizes: 'any', type: 'image/png' },
    ],
    shortcut: '/favicon-256x256.png',
    apple: [{ url: '/favicon-192x192.png', sizes: '192x192', type: 'image/png' }],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon-256x256.png" sizes="256x256" type="image/png" />
        <link rel="icon" href="/favicon-192x192.png" sizes="192x192" type="image/png" />
        <link rel="icon" href="/favicon-128x128.png" sizes="128x128" type="image/png" />
        <link rel="icon" href="/favicon-96x96.png" sizes="96x96" type="image/png" />
        <link rel="icon" href="/favicon-64x64.png" sizes="64x64" type="image/png" />
        <link rel="shortcut icon" href="/favicon-256x256.png" />
        <link rel="apple-touch-icon" href="/favicon-192x192.png" sizes="192x192" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}
