"use client"

import { useState, useEffect, useMemo } from 'react'

interface SustainabilityDAO {
  id: number
  name: string
  chain_id: string
  timestamp: string
  // Full nested structure from enhanced metrics
  network_participation: {
    total_members: number
    num_distinct_voters: number
    participation_rate: number
    unique_proposers?: number
  }
  accumulated_funds: {
    treasury_value_usd: number
    circulating_supply: number
    total_supply: number
    token_price_usd?: number
    circulating_token_percentage: number
    token_velocity?: number
  }
  voting_efficiency: {
    total_proposals: number
    approved_proposals?: number
    approval_rate: number
    avg_voting_duration_days: number
    proposal_states?: Record<string, number>
  }
  decentralisation: {
    largest_holder_percent: number
    on_chain_automation: string | boolean
    token_distribution?: Record<string, any>
    proposer_concentration?: number
  }
  health_metrics?: {
    network_health_score: number
    activity_ratio?: number
    total_volume?: number
    mean_daily_volume?: number
  }
}

interface UseSustainabilityDataOptions {
  searchQuery?: string
  chainId?: string
  limit?: number
}

interface UseSustainabilityDataResult {
  data: SustainabilityDAO[] | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useSustainabilityData(options: UseSustainabilityDataOptions = {}): UseSustainabilityDataResult {
  const [data, setData] = useState<SustainabilityDAO[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
      
      // First, get the list of all DAOs to get their IDs
      const queryParams = new URLSearchParams()
      if (options.searchQuery) queryParams.append('search', options.searchQuery)
      if (options.chainId) queryParams.append('chain_id', options.chainId)
      if (options.limit) queryParams.append('limit', options.limit.toString())
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ''
      console.log(`[useSustainabilityData] Fetching DAO list from: ${apiUrl}/daos${queryString}`)
      
      const listResponse = await fetch(`${apiUrl}/daos${queryString}`)
      
      if (!listResponse.ok) {
        throw new Error(`Failed to fetch DAO list: ${listResponse.status}`)
      }
      
      const listData = await listResponse.json()
      
      if (!listData?.items || !Array.isArray(listData.items)) {
        throw new Error('Invalid DAO list response format')
      }
      
      const daoIds = listData.items.map((dao: any) => dao.id)
      
      if (daoIds.length === 0) {
        setData([])
        return
      }
      
      // Now get the full metrics for all DAOs using the multi endpoint
      console.log(`[useSustainabilityData] Fetching metrics for ${daoIds.length} DAOs`)
      
      const metricsResponse = await fetch(`${apiUrl}/daos/metrics/multi?dao_ids=${daoIds.join(',')}`)
      
      if (!metricsResponse.ok) {
        // If the multi-metrics endpoint fails, fall back to local data
        console.warn('Multi-metrics endpoint failed, falling back to local data')
        const localResponse = await fetch('/dao_data.json')
        if (localResponse.ok) {
          const localData = await localResponse.json()
          console.log(`[useSustainabilityData] Using local data with ${localData.length} DAOs`)
          
          // Apply filters to local data
          let filteredData = localData
          
          if (options.searchQuery) {
            const query = options.searchQuery.toLowerCase()
            filteredData = filteredData.filter((dao: any) =>
              dao.dao_name?.toLowerCase().includes(query) ||
              dao.name?.toLowerCase().includes(query)
            )
          }
          
          if (options.chainId) {
            filteredData = filteredData.filter((dao: any) =>
              dao.chain_id?.toString() === options.chainId
            )
          }
          
          if (options.limit) {
            filteredData = filteredData.slice(0, options.limit)
          }
          
          // Transform local data to match our interface
          const transformedData = filteredData.map((dao: any, index: number) => ({
            id: index + 1,
            name: dao.dao_name || dao.name || 'Unknown DAO',
            chain_id: dao.chain_id?.toString() || '0',
            timestamp: dao.timestamp || new Date().toISOString(),
            network_participation: dao.network_participation || {
              total_members: 0,
              num_distinct_voters: 0,
              participation_rate: 0
            },
            accumulated_funds: dao.accumulated_funds || {
              treasury_value_usd: 0,
              circulating_supply: 0,
              total_supply: 0,
              circulating_token_percentage: 100
            },
            voting_efficiency: dao.voting_efficiency || {
              total_proposals: 0,
              approval_rate: 0,
              avg_voting_duration_days: 7
            },
            decentralisation: dao.decentralisation || {
              largest_holder_percent: 100,
              on_chain_automation: false
            },
            health_metrics: dao.health_metrics || {
              network_health_score: 0
            }
          }))
          
          setData(transformedData)
          return
        } else {
          throw new Error(`Multi-metrics endpoint failed: ${metricsResponse.status}`)
        }
      }
      
      const metricsData = await metricsResponse.json()
      
      if (!Array.isArray(metricsData)) {
        throw new Error('Invalid metrics response format')
      }
      
      console.log(`[useSustainabilityData] Successfully loaded ${metricsData.length} DAOs with full metrics`)
      setData(metricsData)
      
    } catch (err) {
      console.error('[useSustainabilityData] Error:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch sustainability data'))
      
      // Final fallback to local data
      try {
        console.log('[useSustainabilityData] Attempting fallback to local data')
        const localResponse = await fetch('/dao_data.json')
        if (localResponse.ok) {
          const localData = await localResponse.json()
          
          let filteredData = localData
          
          if (options.searchQuery) {
            const query = options.searchQuery.toLowerCase()
            filteredData = filteredData.filter((dao: any) =>
              dao.dao_name?.toLowerCase().includes(query) ||
              dao.name?.toLowerCase().includes(query)
            )
          }
          
          if (options.chainId) {
            filteredData = filteredData.filter((dao: any) =>
              dao.chain_id?.toString() === options.chainId
            )
          }
          
          if (options.limit) {
            filteredData = filteredData.slice(0, options.limit)
          }
          
          const transformedData = filteredData.map((dao: any, index: number) => ({
            id: index + 1,
            name: dao.dao_name || dao.name || 'Unknown DAO',
            chain_id: dao.chain_id?.toString() || '0',
            timestamp: dao.timestamp || new Date().toISOString(),
            network_participation: dao.network_participation || {
              total_members: 0,
              num_distinct_voters: 0,
              participation_rate: 0
            },
            accumulated_funds: dao.accumulated_funds || {
              treasury_value_usd: 0,
              circulating_supply: 0,
              total_supply: 0,
              circulating_token_percentage: 100
            },
            voting_efficiency: dao.voting_efficiency || {
              total_proposals: 0,
              approval_rate: 0,
              avg_voting_duration_days: 7
            },
            decentralisation: dao.decentralisation || {
              largest_holder_percent: 100,
              on_chain_automation: false
            },
            health_metrics: dao.health_metrics || {
              network_health_score: 0
            }
          }))
          
          setData(transformedData)
          console.log(`[useSustainabilityData] Fallback successful: ${transformedData.length} DAOs`)
        }
      } catch (fallbackErr) {
        console.error('[useSustainabilityData] Fallback also failed:', fallbackErr)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [options.searchQuery, options.chainId, options.limit])

  const refetch = () => {
    fetchData()
  }

  return { data, isLoading, error, refetch }
}
