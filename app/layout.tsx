import type { Metadata } from 'next'
import { Providers } from './providers'
import './styles/globals.css'
import Navbar from './components/Navbar'

export const metadata: Metadata = {
  title: 'Noomo AI - Memorable Learning Jingles',
  description: 'Turn study notes into unforgettable mnemonic devices',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-64x64.png', sizes: '64x64', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/logo.png', sizes: 'any', type: 'image/png' }
    ],
    shortcut: '/favicon-64x64.png',
    apple: [
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' }
    ],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/favicon-48x48.png" sizes="48x48" type="image/png" />
        <link rel="icon" href="/favicon-64x64.png" sizes="64x64" type="image/png" />
        <link rel="icon" href="/favicon-96x96.png" sizes="96x96" type="image/png" />
        <link rel="shortcut icon" href="/favicon-64x64.png" />
        <link rel="apple-touch-icon" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
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
