"use client"

// lib/hooks/useMultiDAOMetrics.ts
import { useState, useEffect } from 'react';

interface MultiDAOMetricsResult {
  data: any[] | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook to fetch metrics for multiple DAOs efficiently
 * @param daoIds Array of DAO IDs to fetch metrics for
 * @returns Object containing data, loading state, and error
 */
export function useMultiDAOMetrics(daoIds: number[]): MultiDAOMetricsResult {
  const [data, setData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchMultiDAOMetrics = async () => {
      if (!daoIds.length) {
        setData([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Always fetch local data first as a backup source
        console.log('Pre-fetching local data as fallback');
        let localData = null;
        
        try {
          const localResponse = await fetch('/dao_data.json');
          if (localResponse.ok) {
            localData = await localResponse.json();
            console.log(`Successfully pre-loaded ${localData.length} DAOs from local JSON as backup`);
          }
        } catch (localError) {
          console.warn('Failed to pre-load local data:', localError);
        }
        
        // First try the API endpoint
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        let apiData = null;
        let finalData;
        
        try {
          // Try the official API endpoint
          console.log(`Attempting to fetch data from ${apiUrl}/daos/metrics/multi?dao_ids=${daoIds.join(',')}`);
          const apiResponse = await fetch(`${apiUrl}/daos/metrics/multi?dao_ids=${daoIds.join(',')}`);
          
          if (apiResponse.ok) {
            apiData = await apiResponse.json();
            console.log(`Successfully loaded ${apiData.length} DAOs from API`);
            
            // If we have both API and local data, merge them for best results
            if (localData) {
              console.log('Enhancing API data with local metrics where missing');
              apiData = apiData.map(apiDao => {
                // Find matching local DAO
                const localDao = localData[apiDao.id - 1]; // Adjust for 0-based index
                if (localDao) {
                  // Check if API dao has missing metric data that we can get from local
                  return {
                    ...apiDao,
                    network_participation: apiDao.network_participation || localDao.network_participation,
                    accumulated_funds: apiDao.accumulated_funds || localDao.accumulated_funds,
                    voting_efficiency: apiDao.voting_efficiency || localDao.voting_efficiency,
                    decentralisation: apiDao.decentralisation || localDao.decentralisation,
                    health_metrics: apiDao.health_metrics || localDao.health_metrics
                  };
                }
                return apiDao;
              });
            }
            
            finalData = apiData;
          } else {
            throw new Error(`API returned status ${apiResponse.status}`);
          }
        } catch (apiError) {
          console.warn('API fetch failed, falling back to local data:', apiError);
          
          // If we already fetched local data, use it
          if (!localData) {
            // Fallback to local JSON file
            console.log('Fetching from local JSON file');
            const response = await fetch('/dao_data.json');
            
            if (!response.ok) {
              throw new Error(`Failed to fetch local JSON data (${response.status})`);
            }
            
            localData = await response.json();
            console.log('Successfully loaded data from local JSON');
          }
          
          finalData = localData;
        }
        
        // Get the data for each requested DAO
        const selectedDAOs = daoIds.map(id => {
          // Ensure we have a valid ID before proceeding
          if (!id || isNaN(id)) {
            console.warn(`Invalid DAO ID: ${id}`);
            return null;
          }
          
          let daoData;
          
          // If finalData is from API (array of objects with id field), find by id
          if (Array.isArray(finalData) && finalData.length > 0 && finalData[0].id !== undefined) {
            daoData = finalData.find(dao => dao.id === id);
          } else {
            // If finalData is from local JSON (array indexed by position), use index
            daoData = finalData[id - 1]; // Adjust for 0-based index
          }
          
          if (!daoData) {
            console.warn(`DAO with ID ${id} not found in the dataset`);
            return null;
          }
          
          // Safely extract values with validation - check both API format (name) and local format (dao_name)
          const daoName = daoData.name || daoData.dao_name || 'Unknown DAO';
          const chainId = daoData.chain_id ? daoData.chain_id.toString() : '0';
          
          try {
            // Create a well-formed object with all necessary fields and explicit nulls for missing values
            return {
              id: id,
              name: daoName, // Use 'name' to match API format
              dao_name: daoName, // Keep dao_name for backward compatibility
              chain_id: chainId,
              description: `${daoName} is a decentralized autonomous organization.`,
              created_at: daoData.timestamp || new Date().toISOString(),
              // Include all metrics with more detailed null checks
              network_participation: {
                participation_rate: daoData.network_participation?.participation_rate ?? null,
                total_members: daoData.network_participation?.total_members ?? null,
                num_distinct_voters: daoData.network_participation?.num_distinct_voters ?? null,
                unique_proposers: daoData.network_participation?.unique_proposers ?? null
              },
              accumulated_funds: {
                treasury_value_usd: daoData.accumulated_funds?.treasury_value_usd ?? null,
                circulating_supply: daoData.accumulated_funds?.circulating_supply ?? null,
                total_supply: daoData.accumulated_funds?.total_supply ?? null,
                circulating_token_percentage: daoData.accumulated_funds?.circulating_token_percentage ?? null
              },
              voting_efficiency: {
                total_proposals: daoData.voting_efficiency?.total_proposals ?? null,
                approval_rate: daoData.voting_efficiency?.approval_rate ?? null,
                approved_proposals: daoData.voting_efficiency?.approved_proposals ?? null,
                avg_voting_duration_days: daoData.voting_efficiency?.avg_voting_duration_days ?? null
              },
              decentralisation: {
                largest_holder_percent: daoData.decentralisation?.largest_holder_percent ?? null,
                on_chain_automation: daoData.decentralisation?.on_chain_automation ?? null
              },
              health_metrics: {
                network_health_score: daoData.health_metrics?.network_health_score ?? null
              }
            };
          } catch (dataError) {
            console.error(`Error processing DAO ${id} data:`, dataError);
            // Return a well-structured fallback object with all fields explicitly set to null
            return {
              id: id,
              name: daoName, // Use 'name' to match API format
              dao_name: daoName, // Keep dao_name for backward compatibility
              chain_id: chainId,
              description: `${daoName} (data incomplete)`,
              created_at: new Date().toISOString(),
              network_participation: { 
                participation_rate: null, 
                total_members: null,
                num_distinct_voters: null,
                unique_proposers: null
              },
              accumulated_funds: { 
                treasury_value_usd: null,
                circulating_supply: null,
                total_supply: null,
                circulating_token_percentage: null
              },
              voting_efficiency: { 
                total_proposals: null, 
                approval_rate: null,
                approved_proposals: null,
                avg_voting_duration_days: null
              },
              decentralisation: { 
                largest_holder_percent: null,
                on_chain_automation: null
              },
              health_metrics: { 
                network_health_score: null 
              }
            };
          }
        }).filter(Boolean); // Remove null entries
        
        if (selectedDAOs.length === 0) {
          console.warn('No valid DAOs found after filtering');
          setError(new Error('No data found for the selected DAOs'));
        } else if (selectedDAOs.length < daoIds.length) {
          console.warn(`Only found ${selectedDAOs.length} out of ${daoIds.length} requested DAOs`);
        }
        
        setData(selectedDAOs);
      } catch (err) {
        console.error("Error fetching multiple DAO metrics:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch multiple DAO metrics"));
        
        // If this is a serious error, set data to empty array to avoid UI issues
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMultiDAOMetrics();
  }, [daoIds]);
  
  return { data, isLoading, error };
}