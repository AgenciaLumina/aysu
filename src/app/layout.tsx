// AISSU Beach Lounge - Root Layout
// Layout principal da aplicação

import type { Metadata } from 'next'
import { Montserrat, Crimson_Pro, Poppins, Dancing_Script } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import './globals.css'

// Fontes Profissionais - Instagram-aligned
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  variable: '--font-crimson',
  display: 'swap',
  weight: ['400', '600', '700'],
})

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  variable: '--font-dancing',
  display: 'swap',
  weight: ['400', '700'],
})

// Metadados SEO
export const metadata: Metadata = {
  title: {
    default: 'Aysú Beach Lounge | O Melhor Beach Club do Litoral Norte SP',
    template: '%s | Aysú Beach Lounge',
  },
  description: 'Day use com consumação, piscina, hidromassagem, lounges premium e gastronomia caiçara. Pé na areia em Massaguaçu, Caraguatatuba-SP.',
  keywords: ['beach club', 'litoral norte', 'caraguatatuba', 'massaguaçu', 'day use', 'piscina', 'gastronomia caiçara'],
  authors: [{ name: 'Aysú Beach Lounge' }],
  openGraph: {
    title: 'Aysú Beach Lounge',
    description: 'Existimos para tornar seu dia de praia em um dia de praia perfeito.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Aysú Beach Lounge',
    images: [
      {
        url: 'https://cdn.aysubeachlounge.com.br/thumb.png',
        width: 1200,
        height: 630,
        alt: 'Aysú Beach Lounge - O Lugar Perfeito no Litoral',
      }
    ],
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo_aysu.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="pt-BR"
      className={`
        ${montserrat.variable} 
        ${crimsonPro.variable} 
        ${poppins.variable} 
        ${dancingScript.variable}
      `}
    >
      <body className="min-h-screen antialiased"
      >
        {children}

        {/* WhatsApp Floating Button */}
        <WhatsAppButton />

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#FAF7F2',
              color: '#2E1E16',
              border: '1px solid #E0D5C7',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(46, 30, 22, 0.1)',
            },
            success: {
              iconTheme: {
                primary: '#4CAF50',
                secondary: '#FAF7F2',
              },
            },
            error: {
              iconTheme: {
                primary: '#D84315',
                secondary: '#FAF7F2',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
