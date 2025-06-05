"use client"

import { useQuery } from '@tanstack/react-query';
import { useDebounce } from './useDebounce';

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

interface DAOsResponse {
  items: DAO[];
  total_count: number;
  limit: number;
  offset: number;
}

// API function to fetch DAOs
async function fetchDAOs(options: UseDAOsOptions = {}): Promise<DAOsResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  
  const queryParams = new URLSearchParams();
  
  if (options.searchQuery) queryParams.append('search', options.searchQuery);
  if (options.chainId) queryParams.append('chain_id', options.chainId);
  if (options.limit !== undefined) queryParams.append('limit', options.limit.toString());
  if (options.offset !== undefined) queryParams.append('offset', options.offset.toString());
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const fullUrl = `${apiUrl}/daos${queryString}`;
  console.log(`[useDAOsQuery] Fetching from: ${fullUrl}`);
  
  const response = await fetch(fullUrl);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const apiData = await response.json();
  
  if (!apiData || !apiData.items || !Array.isArray(apiData.items)) {
    throw new Error('Invalid API response format');
  }
  
  // Transform the API data
  const transformedData = apiData.items.map((dao: any) => ({
    id: dao.id,
    name: dao.name || 'Unknown DAO',
    chain_id: dao.chain_id ? dao.chain_id.toString() : '0',
    description: dao.description || `${dao.name || 'Unknown'} is a decentralized autonomous organization.`,
    created_at: dao.created_at || new Date().toISOString(),
    participation_rate: dao.participation_rate || null,
    total_members: dao.total_members || null,
    treasury_value_usd: dao.treasury_value_usd || null,
    total_proposals: dao.total_proposals || null,
    approval_rate: dao.approval_rate || null,
    network_health_score: dao.network_health_score || null
  }));
  
  // Apply client-side filters
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
  
  return {
    items: filteredDAOs,
    total_count: apiData.total_count || filteredDAOs.length,
    limit: apiData.limit || options.limit || 100,
    offset: apiData.offset || options.offset || 0
  };
}

export function useDAOsQuery(options: UseDAOsOptions = {}) {
  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(options.searchQuery || '', 300);
  
  console.log(`[useDAOsQuery] Search query: "${options.searchQuery}" -> Debounced: "${debouncedSearchQuery}"`);
  
  // Create query options with debounced search
  const queryOptions = {
    ...options,
    searchQuery: debouncedSearchQuery
  };
  
  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: [
      'daos', 
      queryOptions.searchQuery,
      queryOptions.chainId,
      queryOptions.minTreasury,
      queryOptions.maxTreasury,
      queryOptions.minParticipation,
      queryOptions.limit,
      queryOptions.offset
    ],
    queryFn: () => fetchDAOs(queryOptions),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    // Don't fetch if search query is being typed (until debounced)
    enabled: !options.searchQuery || debouncedSearchQuery === options.searchQuery
  });
  
  return {
    data: data?.items || null,
    totalCount: data?.total_count || 0,
    isLoading,
    isFetching,
    error,
    refetch
  };
}
