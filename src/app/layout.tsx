import type { Metadata } from 'next'
import { Inter, Manrope } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', weight: ['400','600','700','800'] })

export const metadata: Metadata = {
  title: 'VMS · Vipan Medical Store',
  description: 'India\'s trusted pharmacy platform for wholesalers, retailers and customers.',
  icons: {
    icon: '/vms-icon.svg',
    shortcut: '/vms-icon.svg',
    apple: '/vms-icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <head>
        {/* Preconnect so the font TCP handshake happens before the stylesheet resolves */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* display=block: icons are invisible while loading rather than showing raw text */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#0c1629', color: '#e8f4fd', border: '1px solid rgba(0,194,255,0.2)' }
          }}
        />
      </body>
    </html>
  )
}
