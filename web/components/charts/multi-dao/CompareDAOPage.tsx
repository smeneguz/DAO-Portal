"use client"

import React, { useState, useEffect } from 'react';
import { useDAOSelection } from '../../../lib/context/DAOSelectionContext';
import { Button } from '../../../components/ui/button';
import Link from 'next/link';
import MultiDAOComparisonChart from './MultiDAOComparisonChart';
import { VisualizationWrapper } from '../../../components/visualization/VisualizationWrapper';
import DecentralizationAnalysisImproved3 from '../../../components/visualization/KPIAnalysis/Decentralization/DecentralizationAnalysisImproved3';
import TreasuryAnalysis from '../../../components/visualization/KPIAnalysis/TreasuryAnalysis/TreasuryAnalysis';
import ParticipationAnalysis from '../../../components/visualization/KPIAnalysis/ParticipationAnalysis/ParticipationAnalysis';
import ThresholdAnalysis from '../../../components/visualization/KPIAnalysis/ThresholdAnalysis/ThresholdAnalysis';
import VotingEfficiencyAnalysis from '../../../components/visualization/KPIAnalysis/VotingEfficiencyAnalysis/VotingEfficiencyAnalysis';
import { 
  EmptyStateIcon, 
  BackIcon, 
  LoadingIcon, 
  RefreshIcon, 
  FilterIcon, 
  AnalyticsIcon,
  DecentralizationIcon,
  ParticipationIcon,
  TreasuryIcon,
  VotingIcon,
  ErrorIcon,
  WarningIcon,
  TrashIcon,
  SuccessIcon,
  InfoIcon,
  ClockIcon,
  LightBulbIcon
} from '../../../components/ui/icons';

const CompareDAOPage = () => {
  const { selectedDAOIds, clearSelection } = useDAOSelection();
  const [daoData, setDaoData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  const fetchDAOData = async () => {
    if (selectedDAOIds.length === 0) {
      setDaoData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    
    const localDataPromise = fetch('/dao_data.json').then(res => res.json()).catch(err => {
      console.error('Error fetching local data:', err);
      return null;
    });
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      console.log(`Fetching data for DAOs: ${selectedDAOIds.join(', ')}`);
      
      const response = await fetch(`${apiUrl}/daos/metrics/multi?dao_ids=${selectedDAOIds.join(',')}`);
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
      
      if (apiData && apiData.length > 0) {
        if (localData) {
          apiData = apiData.map(dao => {
            const localDao = localData[dao.id - 1];
            if (localDao) {
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
        const filteredData = selectedDAOIds.map(id => {
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

  useEffect(() => {
    fetchDAOData();
  }, [selectedDAOIds]);
  
  if (selectedDAOIds.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="container mx-auto px-4 py-12">
          {/* Enhanced Header */}
          <div className="text-center mb-16 fade-in">
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 rounded-full blur-3xl transform scale-150"></div>
              <div className="relative">
                <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-primary via-primary/90 to-purple-600 bg-clip-text text-transparent mb-6">
                  Compare DAOs
                </h1>
                <div className="w-24 h-1 bg-gradient-to-r from-primary to-purple-600 mx-auto rounded-full"></div>
              </div>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Analyze and compare multiple DAOs side by side with comprehensive metrics, governance insights, and performance visualizations
            </p>
          </div>
          
          {/* Enhanced Empty State */}
          <div className="max-w-3xl mx-auto">
            <div className="glass-surface p-16 text-center rounded-3xl border-2 border-dashed border-border/30 hover:border-primary/40 transition-all duration-500 group">
              <div className="relative mb-8">
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary/10 via-purple-500/10 to-blue-500/10 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/10 to-transparent rounded-full animate-spin-slow"></div>
                  <EmptyStateIcon className="text-primary relative z-10 group-hover:scale-110 transition-transform duration-300" size="xl" />
                </div>
              </div>
              
              <h3 className="text-3xl font-bold mb-4 text-foreground">Ready to Compare DAOs</h3>
              <p className="text-muted-foreground mb-12 text-lg leading-relaxed max-w-2xl mx-auto">
                Select multiple DAOs from the main dashboard to unlock powerful comparison tools. Analyze governance structures, financial metrics, and community engagement patterns side by side.
              </p>
              
              <div className="space-y-6">
                <Link href="/">
                  <Button className="btn-gradient h-14 px-10 text-lg font-medium shadow-xl hover:shadow-2xl group/button">
                    <BackIcon className="mr-3 group-hover/button:-translate-x-1 transition-transform duration-200" size="lg" />
                    Explore DAOs
                  </Button>
                </Link>
                
                <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Real-time Metrics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>Advanced Visualizations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span>Governance Analysis</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/98 to-primary/3">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="glass-header sticky top-0 z-50 -mx-4 px-4 py-8 mb-12 rounded-b-3xl shadow-xl backdrop-blur-xl border-b border-border/20">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-4 fade-in">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-purple-600 flex items-center justify-center shadow-xl">
                  <AnalyticsIcon className="text-primary-foreground" size="xl" />
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-primary/90 to-purple-600 bg-clip-text text-transparent">
                    DAO Comparison
                  </h1>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                      <span className="text-muted-foreground font-medium">
                        {selectedDAOIds.length} {selectedDAOIds.length === 1 ? 'DAO' : 'DAOs'} Selected
                      </span>
                    </div>
                    {errorMessage && (
                      <div className="flex items-center gap-2 text-amber-600 text-sm">
                        <WarningIcon size="sm" />
                        <span>Partial data loaded</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 fade-in stagger-animation">
              <Button 
                variant="outline" 
                size="lg"
                onClick={fetchDAOData}
                disabled={isLoading}
                className="h-12 px-6 border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group"
              >
                <LoadingIcon className={`mr-2 transition-transform duration-300 ${isLoading ? '' : 'group-hover:rotate-180'}`} />
                {isLoading ? 'Refreshing...' : 'Refresh Data'}
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => {
                  clearSelection();
                  window.location.href = '/';
                }}
                className="h-12 px-6 border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20 dark:hover:border-red-700 transition-all duration-300"
              >
                <TrashIcon className="mr-2" />
                Clear Selection
              </Button>
              
              <Link href="/">
                <Button size="lg" className="btn-gradient h-12 px-8 shadow-lg hover:shadow-xl">
                  <BackIcon className="mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Enhanced Navigation Tabs */}
        <div className="mb-12 fade-in">
          <div className="glass-surface rounded-2xl p-3 inline-flex space-x-2 shadow-lg">
            {[
              { id: 'basic', label: 'Basic Metrics', component: AnalyticsIcon },
              { id: 'advanced', label: 'Advanced Analysis', component: DecentralizationIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg transform scale-105' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:scale-102'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <div className="flex items-center gap-3">
                  <tab.component />
                  {tab.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      
        {errorMessage && (
          <div className="notification-warning mb-12 fade-in">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <WarningIcon size="lg" />
              </div>
              <div>
                <h3 className="font-bold text-amber-800 dark:text-amber-200 mb-2 text-lg">Data Loading Notice</h3>
                <p className="text-amber-700 dark:text-amber-300">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-8 fade-in">
            <div className="relative">
              <div className="loading-spinner-multi"></div>
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-bold text-foreground">Loading DAO Comparison</h3>
              <p className="text-muted-foreground text-lg">
                Fetching comprehensive data for {selectedDAOIds.length} selected {selectedDAOIds.length === 1 ? 'DAO' : 'DAOs'}...
              </p>
              <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <span>Metrics</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <span>Governance</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  <span>Analytics</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12 fade-in">
            {activeTab === 'basic' ? (
              <div className="chart-container-professional">
                <div className="chart-header-enhanced">
                  <div>
                    <h2 className="chart-title-gradient">Basic Metrics Comparison</h2>
                    <p className="chart-subtitle-enhanced">Core performance indicators and governance metrics across all selected DAOs</p>
                  </div>
                  <div className="status-badge status-badge-success">
                    <SuccessIcon className="mr-2" size="sm" />
                    Live Data
                  </div>
                </div>
                <MultiDAOComparisonChart daoIds={selectedDAOIds} />
              </div>
            ) : (
              <div className="space-y-12">
                <div className="chart-container-professional">
                  <div className="chart-header-enhanced">
                    <div>
                      <h2 className="chart-title-gradient">Decentralization Analysis</h2>
                      <p className="chart-subtitle-enhanced">Advanced decentralization metrics, governance distribution, and network effects analysis</p>
                    </div>
                    <div className="status-badge status-badge-info">
                      <InfoIcon className="mr-2" size="sm" />
                      Advanced Analytics
                    </div>
                  </div>
                  <VisualizationWrapper 
                    component={DecentralizationAnalysisImproved3} 
                    data={daoData}
                  />
                </div>

                {/* Treasury Analysis Section */}
                <div className="chart-container-professional">
                  <div className="chart-header-enhanced">
                    <div>
                      <h2 className="chart-title-gradient">Treasury & Token Distribution Analysis</h2>
                      <p className="chart-subtitle-enhanced">Comprehensive analysis of treasury holdings, token circulation patterns, and financial sustainability metrics</p>
                    </div>
                    <div className="status-badge status-badge-info">
                      <InfoIcon className="mr-2" size="sm" />
                      Financial Analytics
                    </div>
                  </div>
                  <TreasuryAnalysis 
                    data={daoData}
                    mode="multi"
                    title="Multi-DAO Treasury Comparison"
                  />
                </div>
                
                {/* Participation Analysis Section */}
                <div className="chart-container-professional">
                  <div className="chart-header-enhanced">
                    <div>
                      <h2 className="chart-title-gradient">Participation & Engagement Analysis</h2>
                      <p className="chart-subtitle-enhanced">Community participation patterns, member engagement levels, and voting behavior across network sizes</p>
                    </div>
                    <div className="status-badge status-badge-success">
                      <ParticipationIcon className="mr-2" size="sm" />
                      Participation Analytics
                    </div>
                  </div>
                  <ParticipationAnalysis 
                    data={daoData}
                    mode="multi"
                    title="Multi-DAO Participation Comparison"
                  />
                </div>

                {/* Threshold Analysis Section */}
                <div className="chart-container-professional">
                  <div className="chart-header-enhanced">
                    <div>
                      <h2 className="chart-title-gradient">Governance Threshold Analysis</h2>
                      <p className="chart-subtitle-enhanced">Participation threshold categorization and governance effectiveness metrics</p>
                    </div>
                    <div className="status-badge status-badge-info">
                      <AnalyticsIcon className="mr-2" size="sm" />
                      Threshold Analytics
                    </div>
                  </div>
                  <ThresholdAnalysis 
                    data={daoData}
                    mode="multi"
                    title="Multi-DAO Threshold Comparison"
                  />
                </div>

                {/* Voting Efficiency Analysis Section */}
                <div className="chart-container-professional">
                  <div className="chart-header-enhanced">
                    <div>
                      <h2 className="chart-title-gradient">Voting Efficiency Analysis</h2>
                      <p className="chart-subtitle-enhanced">Proposal approval rates, voting duration patterns, and governance efficiency metrics across DAOs</p>
                    </div>
                    <div className="status-badge status-badge-success">
                      <VotingIcon className="mr-2" size="sm" />
                      Voting Analytics
                    </div>
                  </div>
                  <VotingEfficiencyAnalysis 
                    data={daoData}
                    mode="multi"
                    title="Multi-DAO Voting Efficiency Comparison"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompareDAOPage;