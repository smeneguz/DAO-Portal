// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useDAOs } from '../lib/hooks/useDAOs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import Link from 'next/link';
import { useDAOSelection } from '../lib/context/DAOSelectionContext';
import { 
  DashboardIcon, 
  SearchIcon, 
  RefreshIcon, 
  FilterIcon, 
  ErrorIcon, 
  InfoIcon, 
  SuccessIcon, 
  TreasuryIcon, 
  VotingIcon, 
  ParticipationIcon, 
  DecentralizationIcon,
  EmptyStateIcon,
  ViewIcon
} from '../components/ui/icons';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [chainFilter, setChainFilter] = useState<string | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { data: daos, isLoading, error } = useDAOs({
    searchQuery,
    chainId: chainFilter
  });
  
  const { isDAOSelected, toggleDAOSelection, selectedDAOIds, clearSelection } = useDAOSelection();
  
  // Force refresh of data when selectedDAOIds changes
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
    console.log("Selection changed, refreshing data:", selectedDAOIds.length);
  }, [selectedDAOIds.length]);

  // Extract unique chain IDs for filtering
  const chainIds = daos ? Array.from(new Set(daos.map(dao => dao.chain_id))) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/98 to-muted/20 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
      
      <div className="container mx-auto py-6 px-4 max-w-7xl relative z-10">
        {/* Enhanced Hero Section - Mobile-First Responsive */}
        <div className="mb-8 text-center relative">
          {/* Background decoration - smaller and more subtle */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 bg-gradient-to-r from-primary/8 via-purple-500/8 to-blue-500/8 rounded-full blur-3xl opacity-60"></div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <div className="relative group flex-shrink-0">
              <div className="w-14 h-14 md:w-16 md:h-16 lg:w-18 lg:h-18 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent"></div>
                <DashboardIcon className="text-primary-foreground relative z-10" size="xl" />
              </div>
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-purple-600 bg-clip-text text-transparent mb-1">
                DAO Portal
              </h1>
              <p className="text-sm md:text-base lg:text-lg text-muted-foreground font-medium">
                Analytics & Insights Platform
              </p>
            </div>
          </div>
          
          <div className="max-w-2xl mx-auto space-y-3">
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Comprehensive analytics and insights for decentralized autonomous organizations
            </p>
            <p className="text-sm md:text-base text-muted-foreground/80 leading-relaxed">
              Compare governance metrics, track participation rates, and analyze treasury data across multiple DAOs
            </p>
          </div>
        </div>
        
        {/* Enhanced Filters Section */}
        <Card className="mb-8 border-none shadow-xl bg-white/70 dark:bg-card/70 backdrop-blur-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              <div className="relative flex-1 w-full lg:w-auto">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                  <SearchIcon className="text-muted-foreground" />
                </div>
                <Input
                  type="text"
                  placeholder="Search DAOs by name, description, or token..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 w-full bg-background/80 border-2 border-border/30 focus:border-primary/50 focus:bg-background rounded-xl transition-all duration-200 text-sm placeholder:text-muted-foreground/60 shadow-sm"
                />
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 w-full lg:w-auto lg:flex-shrink-0">
                <Button
                  variant={!chainFilter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChainFilter(undefined)}
                  className={`whitespace-nowrap h-10 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                    !chainFilter 
                      ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl' 
                      : 'hover:bg-muted/50 hover:border-primary/30'
                  }`}
                >
                  <span className="hidden sm:inline">All Chains</span>
                  <span className="sm:hidden">All</span>
                </Button>
                {chainIds.map(chainId => (
                  <Button
                    key={chainId}
                    variant={chainFilter === chainId ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChainFilter(chainId)}
                    className={`whitespace-nowrap h-10 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                      chainFilter === chainId 
                        ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl' 
                        : 'hover:bg-muted/50 hover:border-primary/30'
                    }`}
                  >
                    {chainId}
                  </Button>
                ))}
              </div>
              
              <div className="flex items-center gap-3 lg:flex-shrink-0">
                {selectedDAOIds.length > 0 && (
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearSelection} 
                      className="h-10 px-4 text-sm border-2 hover:border-red-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 dark:hover:text-red-400 dark:hover:border-red-800 transition-all duration-200 rounded-lg"
                    >
                      Clear ({selectedDAOIds.length})
                    </Button>
                    <Link href="/dao/compare">
                      <Button 
                        size="sm" 
                        className="relative h-10 px-6 bg-gradient-to-r from-primary via-primary/90 to-purple-600 hover:from-primary/90 hover:via-primary/80 hover:to-purple-500 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg"
                      >
                        Compare DAOs
                        <span className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold border-2 border-background shadow-md animate-pulse">
                          {selectedDAOIds.length}
                        </span>
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-8">
              {/* Outer ring */}
              <div className="animate-spin h-12 w-12 border-4 border-primary/20 rounded-full border-t-primary shadow-lg"></div>
              {/* Inner pulse */}
              <div className="absolute inset-2 animate-pulse h-8 w-8 border-2 border-transparent rounded-full border-t-primary/60"></div>
              {/* Center dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
              </div>
            </div>
            <div className="text-center space-y-3 max-w-sm">
              <h3 className="text-lg font-semibold text-foreground">Loading DAOs</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Fetching data from multiple blockchain networks...
              </p>
              <div className="flex justify-center space-x-1 mt-4">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/10 dark:border-red-800 max-w-2xl mx-auto">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <ErrorIcon className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-destructive text-base">Error Loading DAOs</h3>
                  <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* DAO Grid */}
        {!isLoading && !error && daos && (
          <div className="space-y-6">
            {/* Enhanced Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
              <Card className="border-none bg-gradient-to-br from-blue-50/80 to-blue-100/80 dark:from-blue-950/50 dark:to-blue-900/50 backdrop-blur-sm hover:scale-105 transition-all duration-200">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="h-6 w-6 md:h-8 md:w-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <DashboardIcon size="sm" className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">Total DAOs</p>
                      <p className="text-lg md:text-xl font-bold truncate">{daos.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-none bg-gradient-to-br from-green-50/80 to-green-100/80 dark:from-green-950/50 dark:to-green-900/50 backdrop-blur-sm hover:scale-105 transition-all duration-200">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="h-6 w-6 md:h-8 md:w-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <SuccessIcon size="sm" className="text-green-600 dark:text-green-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">Selected</p>
                      <p className="text-lg md:text-xl font-bold truncate">{selectedDAOIds.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-none bg-gradient-to-br from-purple-50/80 to-purple-100/80 dark:from-purple-950/50 dark:to-purple-900/50 backdrop-blur-sm hover:scale-105 transition-all duration-200">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="h-6 w-6 md:h-8 md:w-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <DecentralizationIcon size="sm" className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">Chains</p>
                      <p className="text-lg md:text-xl font-bold truncate">{chainIds.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-none bg-gradient-to-br from-orange-50/80 to-orange-100/80 dark:from-orange-950/50 dark:to-orange-900/50 backdrop-blur-sm hover:scale-105 transition-all duration-200">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="h-6 w-6 md:h-8 md:w-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <ParticipationIcon size="sm" className="text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">Avg Members</p>
                      <p className="text-lg md:text-xl font-bold truncate">{Math.round(daos.reduce((acc, dao) => acc + (dao.total_members || 0), 0) / daos.length).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Enhanced DAO Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {daos.map(dao => (
                <div key={dao.id} onClick={() => toggleDAOSelection(dao.id)}>
                  <Card 
                    className={`group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 backdrop-blur-sm ${
                      isDAOSelected(dao.id) 
                        ? 'border-primary bg-primary/8 shadow-xl ring-2 ring-primary/30 scale-[1.02]' 
                        : 'border-border/50 hover:border-primary/40 bg-card/80 hover:bg-card hover:scale-[1.01]'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base md:text-lg group-hover:text-primary transition-colors truncate">
                            {dao.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center rounded-full bg-muted/80 px-2.5 py-1 text-xs font-medium border border-border/30">
                              Chain {dao.chain_id}
                            </span>
                            {isDAOSelected(dao.id) && (
                              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-primary to-primary/80 px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm animate-pulse">
                                Selected
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          isDAOSelected(dao.id) 
                            ? 'border-primary bg-primary shadow-md' 
                            : 'border-muted-foreground/50 group-hover:border-primary group-hover:bg-primary/10'
                        }`}>
                          {isDAOSelected(dao.id) && (
                            <SuccessIcon size="xxs" className="text-primary-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1">
                            <p className="text-muted-foreground font-medium">Members</p>
                            <p className="font-bold text-sm text-foreground">{dao.total_members?.toLocaleString() || 'N/A'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground font-medium">Participation</p>
                            <p className="font-bold text-sm text-foreground">
                              {dao.participation_rate ? `${(dao.participation_rate * 100).toFixed(1)}%` : 'N/A'}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground font-medium">Treasury</p>
                            <p className="font-bold text-sm text-foreground">
                              {dao.treasury_value_usd ? `$${(dao.treasury_value_usd / 1000000).toFixed(1)}M` : 'N/A'}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground font-medium">Health Score</p>
                            <p className="font-bold text-sm text-foreground">
                              {dao.network_health_score ? dao.network_health_score.toFixed(1) : 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="pt-3 border-t border-border/50">
                          <Link href={`/dao/${dao.id}`} onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full text-xs h-9 font-medium border-2 group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-primary/80 group-hover:text-primary-foreground group-hover:border-primary transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Empty State */}
        {!isLoading && !error && (!daos || daos.length === 0) && (
          <div className="bg-gradient-to-br from-muted/20 to-muted/5 border-2 border-dashed border-muted-foreground/20 p-12 rounded-2xl text-center max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-all duration-200">
              <EmptyStateIcon className="text-muted-foreground" size="lg" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">No DAOs Found</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {searchQuery || chainFilter 
                ? "Try adjusting your search criteria or filters to find more DAOs" 
                : "There are no DAOs in the database yet. Check back later!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}