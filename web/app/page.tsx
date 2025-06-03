// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useDAOs } from '../lib/hooks/useDAOs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import Link from 'next/link';
import { useDAOSelection } from '../lib/context/DAOSelectionContext';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [chainFilter, setChainFilter] = useState<string | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0); // Add a refresh key to force data reload
  
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
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">DAO Portal</h1>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
          <div className="relative w-full md:w-96">
            <Input
              type="search"
              placeholder="Search DAOs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
            <Button
              variant={!chainFilter ? "default" : "outline"}
              size="sm"
              onClick={() => setChainFilter(undefined)}
            >
              All Chains
            </Button>
            {chainIds.map(chainId => (
              <Button
                key={chainId}
                variant={chainFilter === chainId ? "default" : "outline"}
                size="sm"
                onClick={() => setChainFilter(chainId)}
              >
                {chainId}
              </Button>
            ))}
          </div>

          <div className="ml-auto flex flex-col md:flex-row items-end md:items-center gap-2">
            <div className="relative group">
              <span className={`text-sm ${selectedDAOIds.length >= 20 ? "text-amber-600 font-medium" : "text-gray-500"}`}>
                {selectedDAOIds.length} / {daos?.length || 0} selected
              </span>
              {selectedDAOIds.length >= 20 && (
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs rounded py-1 px-2 -bottom-8 right-0 pointer-events-none z-10 whitespace-nowrap">
                  Maximum selection limit reached
                </div>
              )}
            </div>
            {selectedDAOIds.length > 0 && (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    console.log("Clearing selection from UI...");
                    clearSelection();
                  }}
                >
                  Clear Selection
                </Button>
                <Link href="/dao/compare">
                  <Button 
                    size="sm"
                    className="relative"
                  >
                    <span>Compare Selected</span>
                    <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {selectedDAOIds.length}
                    </span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-red-800 mb-4">Error</h2>
          <p className="text-red-600">{error.message}</p>
        </div>
      )}

      {!isLoading && !error && daos && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {daos.map(dao => (
            <Card key={dao.id} className="h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{dao.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="group relative">
                      <Button
                        variant={isDAOSelected(dao.id) ? "default" : "ghost"}
                        size="sm"
                        className={`h-8 transition-colors ${isDAOSelected(dao.id) ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : ""}`}
                        onClick={() => toggleDAOSelection(dao.id)}
                      >
                        {isDAOSelected(dao.id) ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mr-1">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                            <span className="text-xs">Selected</span>
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                              <rect width="18" height="18" x="3" y="3" rx="2" />
                            </svg>
                            <span className="text-xs">Compare</span>
                          </>
                        )}
                      </Button>
                      <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs rounded py-1 px-2 -bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-none z-10 whitespace-nowrap">
                        {isDAOSelected(dao.id) ? 'Remove from comparison' : 'Add to comparison'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Chain ID: {dao.chain_id}</div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-center">
                    <div className="text-lg font-semibold">
                      {dao.participation_rate !== null && dao.participation_rate !== undefined ? 
                        `${dao.participation_rate.toFixed(1)}%` : 'N/A'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Participation</div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-center">
                    <div className="text-lg font-semibold">
                      {dao.total_members !== null && dao.total_members !== undefined ? 
                        dao.total_members.toLocaleString() : 'N/A'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Members</div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-center">
                    <div className="text-lg font-semibold">
                      {dao.treasury_value_usd !== null && dao.treasury_value_usd !== undefined ? 
                        `$${dao.treasury_value_usd >= 1_000_000 
                          ? (dao.treasury_value_usd / 1_000_000).toFixed(1) + 'M' 
                          : dao.treasury_value_usd >= 1_000 
                            ? (dao.treasury_value_usd / 1_000).toFixed(1) + 'K' 
                            : dao.treasury_value_usd.toFixed(0)
                        }` 
                        : 'N/A'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Treasury</div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-center">
                    <div className="text-lg font-semibold">
                      {dao.network_health_score !== null && dao.network_health_score !== undefined ? 
                        dao.network_health_score.toFixed(1) : 'N/A'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Health Score</div>
                  </div>
                </div>
                <div className="mt-6">
                  <Link href={`/dao/${dao.id}`}>
                    <Button variant="outline" className="w-full">View Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && !error && (!daos || daos.length === 0) && (
        <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-center">
          <h3 className="text-xl font-semibold mb-2">No DAOs Found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery || chainFilter 
              ? "Try adjusting your search criteria" 
              : "There are no DAOs in the database yet"}
          </p>
        </div>
      )}
    </div>
  );
}
