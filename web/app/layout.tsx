import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DAO Portal',
  description: 'Analytics platform for tracking and visualizing DAO metrics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <header className="border-b">
              <div className="container mx-auto py-4 px-4">
                <nav className="flex justify-between items-center">
                  <a href="/" className="text-xl font-bold">DAO Portal</a>
                  <div className="flex space-x-4">
                    <a href="/dao" className="text-sm font-medium hover:text-primary">DAOs</a>
                  </div>
                </nav>
              </div>
            </header>
            <main className="flex-1 container mx-auto py-8 px-4">
              {children}
            </main>
            <footer className="border-t py-6">
              <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} DAO Portal. All rights reserved.
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}