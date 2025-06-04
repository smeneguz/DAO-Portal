// app/layout.tsx
import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '../components/theme-provider';
import Navbar from '../components/navbar';
import { DAOSelectionProvider } from '../lib/context/DAOSelectionContext';
import { Providers } from './providers'; // Import the Providers component
import { DashboardIcon } from '../components/ui/icons';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DAO Portal',
  description: 'Analytics and monitoring for DAOs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers> {/* Add the Providers component here */}
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <DAOSelectionProvider>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow">
                  {children}
                </main>
                <footer className="border-t border-border/20 py-8 mt-16 bg-muted/30 backdrop-blur-sm">
                  <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center shadow-sm">
                          <DashboardIcon size="xs" className="text-primary-foreground" />
                        </div>
                        <span className="text-sm font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                          DAO Portal
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <span>System Online</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span>Real-time Data</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} DAO Portal • Built with Next.js
                      </p>
                    </div>
                  </div>
                </footer>
              </div>
            </DAOSelectionProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}