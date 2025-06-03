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
            // First try direct index match, then try name match as backup
            const localDao = localData[dao.id - 1] || 
                         localData.find(d => d.dao_name === dao.name || d.dao_name === dao.dao_name);
            
            if (localDao) {
              console.log(`Found local metrics for DAO ${dao.id}/${dao.name || dao.dao_name}`);
              // Fill in any missing metrics from local data
              return {
                ...dao,
                network_participation: dao.network_participation || localDao.network_participation,
                accumulated_funds: dao.accumulated_funds || localDao.accumulated_funds,
                voting_efficiency: dao.voting_efficiency || localDao.voting_efficiency,
                decentralisation: dao.decentralisation || localDao.decentralisation,
                health_metrics: dao.health_metrics || localDao.health_metrics
              };
            } else {
              console.warn(`No local metrics found for DAO ${dao.id}/${dao.name || dao.dao_name}`);
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
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Compare DAOs</h1>
        
        <div className="bg-yellow-50 dark:bg-yellow-900 p-8 rounded-lg text-center">
          <h3 className="text-xl font-semibold mb-2 text-yellow-800 dark:text-yellow-200">No DAOs Selected</h3>
          <p className="text-yellow-600 dark:text-yellow-300 mb-6">
            Please select at least one DAO from the home page to compare data.
          </p>
          
          <Link href="/">
            <Button>Go to DAOs List</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Compare DAOs</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {selectedDAOIds.length} DAOs selected
          </span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => {
                fetchDAOData();
              }, 300);
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className={`mr-1 ${isLoading ? 'animate-spin' : ''}`}
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            Refresh Data
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              clearSelection();
              // Force navigation back to home after clearing to ensure proper state reset
              window.location.href = '/';
            }}
          >
            Clear Selection
          </Button>
          <Link href="/">
            <Button variant="outline" size="sm">
              Back to List
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Tabs for basic and advanced visualizations */}
      <div className="mb-6 border-b">
        <div className="flex space-x-6">
          <button
            className={`pb-2 px-1 text-lg ${activeTab === 'basic' ? 
              'font-semibold border-b-2 border-blue-500' : 
              'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
            onClick={() => setActiveTab('basic')}
          >
            Basic Metrics
          </button>
          <button
            className={`pb-2 px-1 text-lg ${activeTab === 'advanced' ? 
              'font-semibold border-b-2 border-blue-500' : 
              'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
            onClick={() => setActiveTab('advanced')}
          >
            Advanced Analysis
          </button>
        </div>
      </div>
      
      {errorMessage && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 3.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 3.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-12">
          {activeTab === 'basic' ? (
            // Original basic comparison chart
            <MultiDAOComparisonChart daoIds={selectedDAOIds} />
          ) : (
            // Advanced visualizations
            <div className="space-y-16">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h2 className="text-2xl font-semibold mb-6">Decentralization Analysis</h2>
                <VisualizationWrapper 
                  component={DecentralizationAnalysisImproved3} 
                  data={daoData}
                />
              </div>
              
              {/* You can add more advanced visualizations here */}
              {/*
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h2 className="text-2xl font-semibold mb-6">Participation Analysis</h2>
                <VisualizationWrapper 
                  component={ParticipationAnalysisComplete} 
                  data={daoData}
                />
              </div>
              */}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompareDAOPage;