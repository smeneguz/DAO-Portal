"use client"

// lib/hooks/useDAOs.fix.ts - A clean reimplementation to fix the metrics display issue
import { useState, useEffect } from 'react';

interface DAO {
  id: number;
  name: string;
  chain_id: string;
  description?: string;
  created_at: string;
  participation_rate?: number;
  total_members?: number;
  treasury_value_usd?: number;
  total_proposals?: number;
  approval_rate?: number;
  network_health_score?: number;
}

interface UseDAOsOptions {
  searchQuery?: string;
  chainId?: string;
  minTreasury?: number;
  maxTreasury?: number;
  minParticipation?: number;
  limit?: number;
  offset?: number;
}

export function useDAOs(options: UseDAOsOptions = {}) {
  const [data, setData] = useState<DAO[] | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDAOs = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get API URL from environment or use default
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        
        // Fetch from the API
        const queryParams = new URLSearchParams();
        
        if (options.searchQuery) queryParams.append('name', options.searchQuery);
        if (options.chainId) queryParams.append('chain_id', options.chainId);
        if (options.limit !== undefined) queryParams.append('limit', options.limit.toString());
        if (options.offset !== undefined) queryParams.append('skip', options.offset.toString());
        
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        console.log(`Fetching from ${apiUrl}/daos${queryString}`);
        const response = await fetch(`${apiUrl}/daos${queryString}`);
        
        if (!response.ok) {
          console.error(`API returned status code ${response.status}`);
          throw new Error(`API error: ${response.status}`);
        }
        
        // Parse the response JSON
        const apiData = await response.json();
        console.log('API response:', apiData);
        
        // Verify the response structure
        if (!apiData || !apiData.items || !Array.isArray(apiData.items)) {
          console.error('Invalid API response format:', apiData);
          throw new Error('Invalid API response format');
        }
        
        // Transform the API data into our DAO format
        const transformedData = apiData.items.map((dao: any) => {
          // Debug log for first item to see structure
          if (dao === apiData.items[0]) {
            console.log('First DAO raw data:', JSON.stringify(dao, null, 2));
          }
          
          // Create a transformed DAO object with all necessary fields
          return {
            id: dao.id,
            name: dao.name || 'Unknown DAO',
            chain_id: dao.chain_id ? dao.chain_id.toString() : '0',
            description: dao.description || `${dao.name || 'Unknown'} is a decentralized autonomous organization.`,
            created_at: dao.created_at || new Date().toISOString(),
            participation_rate: typeof dao.participation_rate === 'number' ? dao.participation_rate : null,
            total_members: typeof dao.total_members === 'number' ? dao.total_members : null,
            treasury_value_usd: typeof dao.treasury_value_usd === 'number' ? dao.treasury_value_usd : null,
            total_proposals: typeof dao.total_proposals === 'number' ? dao.total_proposals : null,
            approval_rate: typeof dao.approval_rate === 'number' ? dao.approval_rate : null,
            network_health_score: typeof dao.network_health_score === 'number' ? dao.network_health_score : null
          };
        });
        
        // Additional filters (if needed)
        let filteredDAOs = transformedData;
        
        if (options.minTreasury !== undefined) {
          filteredDAOs = filteredDAOs.filter(dao => 
            (dao.treasury_value_usd || 0) >= (options.minTreasury || 0)
          );
        }
        
        if (options.maxTreasury !== undefined) {
          filteredDAOs = filteredDAOs.filter(dao => 
            (dao.treasury_value_usd || 0) <= (options.maxTreasury || Infinity)
          );
        }
        
        if (options.minParticipation !== undefined) {
          filteredDAOs = filteredDAOs.filter(dao => 
            (dao.participation_rate || 0) >= (options.minParticipation || 0)
          );
        }
        
        console.log(`Transformed ${filteredDAOs.length} DAOs`);
        setData(filteredDAOs);
        setTotalCount(apiData.total_count || filteredDAOs.length);
      } catch (err) {
        console.error("Error fetching DAOs:", err);
        setError(err instanceof Error ? err : new Error('Failed to fetch DAOs'));
        
        // As a fallback, try to load from the local JSON file
        try {
          console.log("Falling back to local DAO data");
          const response = await fetch('/dao_data.json');
          const jsonData = await response.json();
          
          // Transform the data to match our expected format
          const fallbackData = jsonData.map((dao: any, index: number) => ({
            id: index + 1,
            name: dao.dao_name,
            chain_id: dao.chain_id.toString(),
            description: `${dao.dao_name} is a decentralized autonomous organization.`,
            created_at: dao.timestamp,
            participation_rate: dao.network_participation?.participation_rate,
            total_members: dao.network_participation?.total_members,
            treasury_value_usd: dao.accumulated_funds?.treasury_value_usd,
            total_proposals: dao.voting_efficiency?.total_proposals,
            approval_rate: dao.voting_efficiency?.approval_rate,
            network_health_score: dao.health_metrics?.network_health_score
          }));
          
          setData(fallbackData);
          setTotalCount(fallbackData.length);
          console.log(`Loaded ${fallbackData.length} DAOs from fallback data`);
        } catch (fallbackErr) {
          console.error("Fallback also failed:", fallbackErr);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDAOs();
  }, [
    options.searchQuery,
    options.chainId,
    options.minTreasury,
    options.maxTreasury,
    options.minParticipation,
    options.limit,
    options.offset
  ]);
  
  return { data, isLoading, error, totalCount };
}
