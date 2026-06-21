import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'KvartiraKG — Квартиры в Кыргызстане',
  description: 'Поиск квартир для аренды в Бишкеке и других городах Кыргызстана',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-white text-gray-900">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  )
}
