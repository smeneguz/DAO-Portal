"use client";

// components/navbar.tsx
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDAOSelection } from '../lib/context/DAOSelectionContext';
import { ModeToggle } from './mode-toggle';

const Navbar = () => {
  const { selectedDAOIds } = useDAOSelection();
  const [mounted, setMounted] = useState(false);

  // Only show the client-side rendered content after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold">
            DAO Portal
          </Link>
          <nav className="hidden md:flex ml-8">
            <ul className="flex space-x-6">
              <li>
                <Link href="/" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/dao/compare" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  Compare
                  {mounted && selectedDAOIds.length > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center h-5 w-5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200">
                      {selectedDAOIds.length}
                    </span>
                  )}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
};

export default Navbar;