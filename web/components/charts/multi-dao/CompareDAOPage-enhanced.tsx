"use client"

// components/charts/multi-dao/CompareDAOPage.tsx
import React, { useState, useEffect } from 'react';
import { useDAOSelection } from '../../../lib/context/DAOSelectionContext';
import { Button } from '../../../components/ui/button';
import Link from 'next/link';
import MultiDAOComparisonChart from './MultiDAOComparisonChart';
import { VisualizationWrapper } from '../../../components/visualization/VisualizationWrapper';
import DecentralizationAnalysisImproved3 from '../../../components/visualization/KPIAnalysis/Decentralization/DecentralizationAnalysisImproved3';

const CompareDAOPage = () => {
  const { selectedDAOIds, clearSelection } = useDAOSelection();
  const [daoData, setDaoData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' or 'advanced'

  // Define fetchDAOData outside useEffect so it can be called from a button
  const fetchDAOData = async () => {
    if (selectedDAOIds.length === 0) {
      setDaoData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Reset error state
    setErrorMessage(null);
    
    // Fetch both local data and API data simultaneously for best results
    const localDataPromise = fetch('/dao_data.json').then(res => res.json()).catch(err => {
      console.error('Error fetching local data:', err);
      return null;
    });
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      console.log(`Fetching data for DAOs: ${selectedDAOIds.join(', ')}`);
      
      // Fetch from API first
      const response = await fetch(`${apiUrl}/daos/metrics/multi?dao_ids=${selectedDAOIds.join(',')}`);
      
      // Get local data while API fetch is happening
      const localData = await localDataPromise;
      
      if (!response.ok) {
        console.warn(`API returned ${response.status}, will try to use local data`);
        if (!localData) {
          throw new Error(`Failed to fetch data: API returned ${response.status} and local data is unavailable`);
        }
      }
      
      let apiData = [];
      try {
        apiData = await response.json();
        console.log(`Received data for ${apiData?.length || 0} DAOs from API`);
      } catch (parseError) {
        console.error('Error parsing API response:', parseError);
      }
      
      // If we have API data, use it, otherwise fallback to local data
      if (apiData && apiData.length > 0) {
        // Merge with local data for any missing metrics
        if (localData) {
          apiData = apiData.map(dao => {
            const localDao = localData[dao.id - 1]; // Adjust for 0-based index
            if (localDao) {
              // Fill in any missing metrics from local data
              return {
                ...dao,
                network_participation: dao.network_participation || localDao.network_participation,
                accumulated_funds: dao.accumulated_funds || localDao.accumulated_funds,
                voting_efficiency: dao.voting_efficiency || localDao.voting_efficiency,
                decentralisation: dao.decentralisation || localDao.decentralisation,
                health_metrics: dao.health_metrics || localDao.health_metrics
              };
            }
            return dao;
          });
        }
        
        setDaoData(apiData);
      } else if (localData) {
        // Filter local data to only include selected DAOs
        const filteredData = selectedDAOIds.map(id => {
          // Adjust for 0-based index in the JSON array
          return localData[id - 1] || null;
        }).filter(Boolean);
        
        if (filteredData.length === 0) {
          setErrorMessage('No data found for the selected DAOs');
        } else if (filteredData.length < selectedDAOIds.length) {
          setErrorMessage(`Only found data for ${filteredData.length} out of ${selectedDAOIds.length} selected DAOs`);
        } else {
          setErrorMessage('Using local data - API data unavailable or incomplete');
        }
        
        console.log(`Loaded ${filteredData.length} DAOs from local data`);
        setDaoData(filteredData);
      } else {
        throw new Error('No data available from API or local source');
      }
    } catch (error) {
      console.error('Error fetching DAO data:', error);
      setErrorMessage('Failed to load DAO data. Please try again or check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data for selected DAOs on component mount or when selection changes
  useEffect(() => {
    fetchDAOData();
  }, [selectedDAOIds]);
  
  if (selectedDAOIds.length === 0) {
    return (
      <div className="section-spacing">
        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 rounded-full blur-3xl"></div>
            <h1 className="relative text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-primary/90 to-purple-600 bg-clip-text text-transparent mb-4">
              Compare DAOs
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Analyze and compare multiple DAOs side by side with comprehensive metrics and visualizations
          </p>
        </div>
        
        {/* Enhanced Empty State */}
        <div className="max-w-2xl mx-auto">
          <div className="glass-surface p-12 text-center rounded-2xl border-dashed border-2 border-border/50 hover:border-primary/30 transition-all duration-300">
            <div className="relative mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/10 via-purple-500/10 to-blue-500/10 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-full animate-pulse"></div>
                <svg className="w-10 h-10 text-primary relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-foreground">No DAOs Selected</h3>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Select DAOs from the main dashboard to start comparing their metrics, governance structures, and performance indicators.
            </p>
            
            <Link href="/">
              <Button className="btn-gradient h-12 px-8 text-base font-medium shadow-lg hover:shadow-xl">
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Explore DAOs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="section-spacing fade-in">
      {/* Enhanced Header */}
      <div className="glass-header sticky top-0 z-10 -mx-4 px-4 py-6 mb-8 rounded-b-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-purple-600 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary via-primary/90 to-purple-600 bg-clip-text text-transparent">
                  Compare DAOs
                </h1>
                <p className="text-muted-foreground">
                  Analyzing {selectedDAOIds.length} selected {selectedDAOIds.length === 1 ? 'DAO' : 'DAOs'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchDAOData}
              disabled={isLoading}
              className="h-10 px-4 border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
            >
              <svg className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isLoading ? 'Refreshing...' : 'Refresh Data'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                clearSelection();
                window.location.href = '/';
              }}
              className="h-10 px-4 border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20 dark:hover:border-red-700 transition-all duration-200"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Selection
            </Button>
            <Link href="/">
              <Button size="sm" className="btn-gradient h-10 px-6">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
        
      {/* Enhanced Navigation Tabs */}
      <div className="mb-8">
        <div className="glass-surface rounded-xl p-2 inline-flex space-x-1 shadow-lg">
          <button
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'basic' 
                ? 'bg-primary text-primary-foreground shadow-sm transform scale-105' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
            onClick={() => setActiveTab('basic')}
          >
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Basic Metrics
            </div>
          </button>
          <button
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'advanced' 
                ? 'bg-primary text-primary-foreground shadow-sm transform scale-105' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
            onClick={() => setActiveTab('advanced')}
          >
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Advanced Analysis
            </div>
          </button>
        </div>
      </div>
      
      {errorMessage && (
        <div className="glass-surface border-l-4 border-amber-500 bg-gradient-to-r from-amber-50/80 to-amber-100/80 dark:from-amber-950/80 dark:to-amber-900/80 p-6 mb-8 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 3.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 3.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">Data Loading Notice</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="relative">
            {/* Enhanced Multi-layer Loading Animation */}
            <div className="animate-spin h-16 w-16 border-4 border-primary/20 rounded-full border-t-primary"></div>
            <div className="absolute inset-0 animate-pulse h-16 w-16 border-4 border-transparent rounded-full border-t-primary/40"></div>
            <div className="absolute inset-2 animate-bounce h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <div className="h-3 w-3 bg-primary rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-xl font-medium text-foreground">Loading DAO Comparison</p>
            <p className="text-muted-foreground">
              Fetching comprehensive data for {selectedDAOIds.length} selected DAO{selectedDAOIds.length !== 1 ? 's' : ''}...
            </p>
            <div className="flex space-x-1 justify-center mt-4">
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 fade-slide-in">
          {activeTab === 'basic' ? (
            <div className="glass-surface p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Basic Metrics Comparison</h2>
                    <p className="text-muted-foreground">Core performance indicators across selected DAOs</p>
                  </div>
                  <div className="status-badge status-badge-success">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Active
                  </div>
                </div>
              </div>
              <MultiDAOComparisonChart daoIds={selectedDAOIds} />
            </div>
          ) : (
            // Advanced visualizations
            <div className="space-y-8">
              <div className="glass-surface p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">Decentralization Analysis</h2>
                      <p className="text-muted-foreground">Advanced decentralization metrics and governance distribution</p>
                    </div>
                    <div className="status-badge status-badge-success">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Advanced Analytics
                    </div>
                  </div>
                </div>
                <VisualizationWrapper 
                  component={DecentralizationAnalysisImproved3} 
                  data={daoData}
                />
              </div>
              
              {/* Placeholder for future advanced visualizations */}
              <div className="glass-surface p-8 rounded-2xl opacity-60 border-dashed border-2 border-border/50">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-muted-foreground mb-2">Coming Soon: Participation Analysis</h2>
                      <p className="text-muted-foreground">Detailed member engagement and voting patterns</p>
                    </div>
                    <div className="status-badge status-badge-neutral">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      In Development
                    </div>
                  </div>
                </div>
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-muted-foreground mb-2">Advanced Features Coming Soon</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Additional analytics and visualization tools are being developed to provide deeper insights into DAO performance and governance patterns.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompareDAOPage;
