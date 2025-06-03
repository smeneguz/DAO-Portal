// app/layout.tsx
import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '../components/theme-provider';
import Navbar from '../components/navbar';
import { DAOSelectionProvider } from '../lib/context/DAOSelectionContext';
import { Providers } from './providers'; // Import the Providers component

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
                <footer className="border-t py-4">
                  <div className="container mx-auto text-center text-sm text-gray-500">
                    DAO Portal &copy; {new Date().getFullYear()}
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