import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/lib/context/app-context'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Stoccaggio',
  description: 'Gestionale magazzino multi-profilo',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className={geist.className}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  )
}