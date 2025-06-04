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
                <footer className="glass-surface mt-20 border-t border-border/20 py-12 backdrop-blur-xl">
                  <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                      <div className="space-y-4">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center shadow-lg">
                            <DashboardIcon size="sm" />
                          </div>
                          <span className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                            DAO Portal
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Comprehensive analytics and governance insights for decentralized autonomous organizations.
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="font-semibold text-foreground">Features</h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center justify-center md:justify-start gap-2 hover:text-primary transition-colors cursor-pointer">
                            <div className="w-1 h-1 rounded-full bg-primary"></div>
                            <span>Real-time Metrics</span>
                          </div>
                          <div className="flex items-center justify-center md:justify-start gap-2 hover:text-primary transition-colors cursor-pointer">
                            <div className="w-1 h-1 rounded-full bg-primary"></div>
                            <span>Governance Analysis</span>
                          </div>
                          <div className="flex items-center justify-center md:justify-start gap-2 hover:text-primary transition-colors cursor-pointer">
                            <div className="w-1 h-1 rounded-full bg-primary"></div>
                            <span>Comparative Insights</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="font-semibold text-foreground">Analytics</h3>
                        <div className="text-xs text-muted-foreground space-y-2">
                          <div className="flex items-center justify-center md:justify-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span>System Operational</span>
                          </div>
                          <div className="flex items-center justify-center md:justify-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                            <span>Live Data Feeds</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-border/20 mt-8 pt-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        DAO Portal &copy; {new Date().getFullYear()} • Built with Next.js and TypeScript
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