"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDAOSelection } from '../lib/context/DAOSelectionContext';
import { useDAOs } from '../lib/hooks/useDAOs';
import { ModeToggle } from './mode-toggle';
import {
  DashboardIcon,
  ViewIcon,
  AnalyticsIcon,
  FilterIcon,
  ParticipationIcon,
  DecentralizationIcon,
  SuccessIcon
} from './ui/icons';

const Navbar = () => {
  const { selectedDAOIds } = useDAOSelection();
  const [mounted, setMounted] = useState(false);
  
  // Get DAO data for metrics
  const { data: daos } = useDAOs({});
  
  // Calculate metrics
  const totalDAOs = daos?.length || 0;
  const chainIds = daos ? Array.from(new Set(daos.map(dao => dao.chain_id))) : [];
  const avgMembers = daos && daos.length > 0 
    ? Math.round(daos.reduce((acc, dao) => acc + (dao.total_members || 0), 0) / daos.length)
    : 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/30 backdrop-blur-lg bg-background/95 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <DashboardIcon className="text-primary-foreground" size="sm" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                DAO Portal
              </span>
            </Link>
            
            <nav className="hidden lg:flex">
              <ul className="flex space-x-1">
                <li>
                  <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-muted/60 hover:text-primary">
                    <DashboardIcon size="xs" />
                    <span>Dashboard</span>
                  </Link>
                </li>
                <li>
                  <Link href="/dao" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-muted/60 hover:text-primary">
                    <ViewIcon size="xs" />
                    <span>All DAOs</span>
                  </Link>
                </li>
                <li>
                  <Link href="/dao/compare" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-muted/60 hover:text-primary relative">
                    <AnalyticsIcon size="xs" />
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

          {/* Right: Metrics and Controls */}
          <div className="flex items-center space-x-6">
            {/* Dynamic Metrics */}
            {mounted && (
              <div className="hidden xl:flex items-center space-x-6 text-sm">
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                  <DashboardIcon size="xs" className="text-blue-600" />
                  <span className="font-medium">{totalDAOs}</span>
                  <span className="text-muted-foreground">DAOs</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                  <DecentralizationIcon size="xs" className="text-purple-600" />
                  <span className="font-medium">{chainIds.length}</span>
                  <span className="text-muted-foreground">Chains</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                  <SuccessIcon size="xs" className="text-green-600" />
                  <span className="font-medium">{selectedDAOIds.length}</span>
                  <span className="text-muted-foreground">Selected</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                  <ParticipationIcon size="xs" className="text-orange-600" />
                  <span className="font-medium">{avgMembers.toLocaleString()}</span>
                  <span className="text-muted-foreground">Avg Members</span>
                </div>
              </div>
            )}
            
            {/* Selected DAOs indicator for smaller screens */}
            {mounted && selectedDAOIds.length > 0 && (
              <div className="xl:hidden flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-sm font-semibold text-primary">
                  {selectedDAOIds.length} selected
                </span>
              </div>
            )}
            
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navbar;