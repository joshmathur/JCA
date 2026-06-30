import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: "JCA – Josh's Crypto Aid",
  description: 'AI-powered crypto trading assistant',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white">
        <Header/>
        <div className="flex">
          <Sidebar/>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}