"use client";

// components/navbar.tsx
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDAOSelection } from '../lib/context/DAOSelectionContext';
import { ModeToggle } from './mode-toggle';
import {
  DashboardIcon,
  ViewIcon,
  AnalyticsIcon,
  FilterIcon
} from './ui/icons';

const Navbar = () => {
  const { selectedDAOIds } = useDAOSelection();
  const [mounted, setMounted] = useState(false);

  // Only show the client-side rendered content after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="glass-header sticky top-0 z-50 border-b border-border/30 backdrop-blur-lg bg-background/90 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 flex-shrink-0">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent"></div>
              <DashboardIcon className="text-primary-foreground relative z-10" size="sm" />
            </div>
            <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-primary group-hover:to-primary/80 transition-all duration-300">
              DAO Portal
            </span>
          </Link>
          <nav className="hidden md:flex ml-8">
            <ul className="flex space-x-2">
              <li>
                <Link href="/" className="nav-item rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-muted/60 hover:text-primary flex items-center gap-2.5">
                  <DashboardIcon size="sm" />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link href="/dao" className="nav-item rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-muted/60 hover:text-primary flex items-center gap-2.5">
                  <ViewIcon size="sm" />
                  <span>All DAOs</span>
                </Link>
              </li>
              <li>
                <Link href="/dao/compare" className="nav-item rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-muted/60 hover:text-primary relative flex items-center gap-2.5">
                  <AnalyticsIcon size="sm" />
                  <span>Compare</span>
                  {mounted && selectedDAOIds.length > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 w-5 text-xs font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-full border-2 border-background shadow-lg animate-pulse">
                      {selectedDAOIds.length}
                    </span>
                  )}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          {mounted && selectedDAOIds.length > 0 && (
            <div className="hidden sm:flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-sm"></div>
              <span className="text-sm font-semibold text-primary">
                {selectedDAOIds.length} selected
              </span>
            </div>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
};

export default Navbar;