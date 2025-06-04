"use client"

import React, { useState, useMemo } from 'react'
import { useSustainabilityData } from '../../lib/hooks/useSustainabilityData'
import { useDebounce } from '../../lib/hooks/useDebounce'
import { 
  SustainabilityIcon,
  ParticipationIcon,
  TreasuryIcon,
  VotingIcon,
  DecentralizationIcon,
  ErrorIcon,
  EmptyStateIcon,
  LoadingIcon
} from '../ui/icons'
import { Search, Filter, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface SustainabilityMetrics {
  network_participation: number // 1-3 points
  accumulated_funds: number     // 0.75-3 points  
  voting_efficiency: number     // 1-3 points
  decentralisation: number      // 0.6-3 points
  overall_score: number         // Sum of all KPIs
  sustainability_level: 'High' | 'Medium' | 'Low'
}

interface DAOWithSustainability {
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
  metrics: SustainabilityMetrics
}

// Exact KPI calculations based on the research methodology
const calculateNetworkParticipation = (dao: any): number => {
  // Extract from network_participation object (now guaranteed to exist)
  const totalMembers = dao.network_participation?.total_members || 0
  const numDistinctVoters = dao.network_participation?.num_distinct_voters || 0
  
  if (totalMembers === 0 || numDistinctVoters === 0) return 1 // Default to lowest score
  
  // Calculate participation rate: num_distinct_voters / total_members * 100
  const participationRate = (numDistinctVoters / totalMembers) * 100
  
  // Filter out anomalous data (participation > 100% indicates data quality issues)
  if (participationRate > 100) return 1
  
  // Network Participation scoring (1-3 points) based on thresholds:
  if (participationRate > 40) return 3    // High (>40%): 3 points
  if (participationRate >= 10) return 2   // Medium (10%-40%): 2 points
  return 1                                 // Low (<10%): 1 point
}

const calculateAccumulatedFunds = (dao: any): number => {
  // Extract from accumulated_funds object (now guaranteed to exist)
  const treasuryValueUsd = dao.accumulated_funds?.treasury_value_usd || 0
  const circulatingSupply = dao.accumulated_funds?.circulating_supply || 0
  const totalSupply = dao.accumulated_funds?.total_supply || 0
  const tokenPriceUsd = dao.accumulated_funds?.token_price_usd || 0
  
  // Calculate circulating token percentage
  let circulatingTokenPercentage = dao.accumulated_funds?.circulating_token_percentage || 100
  if (totalSupply > 0 && circulatingSupply > 0) {
    circulatingTokenPercentage = (circulatingSupply / totalSupply) * 100
  }
  
  // Calculate relative treasury value (treasury / market cap) for better assessment
  let relativeTreasuryValue = 0
  if (circulatingSupply > 0 && tokenPriceUsd > 0) {
    const marketCap = circulatingSupply * tokenPriceUsd
    if (marketCap > 0) {
      relativeTreasuryValue = (treasuryValueUsd / marketCap) * 100
    }
  }
  
  // Accumulated Funds scoring (0.75-3 points) based on research methodology:
  // Consider both absolute treasury value and relative strength
  if (treasuryValueUsd >= 1000000000) return 3 // High (>$1B): 3 points
  
  if (treasuryValueUsd >= 100000000) { // $100M-$1B range
    if (circulatingTokenPercentage > 50) return 2.25 // Medium-High (>50% circulating): 2.25 points
    else return 1.5                                  // Medium-Low (<=50% circulating): 1.5 points
  }
  
  // Additional consideration for relative treasury strength
  if (treasuryValueUsd >= 10000000 && relativeTreasuryValue >= 10) return 1.5 // Strong relative position
  if (treasuryValueUsd >= 1000000 && relativeTreasuryValue >= 5) return 1.25  // Moderate relative position
  
  return 0.75 // Low (<$100M or weak relative position): 0.75 points
}

const calculateVotingEfficiency = (dao: any): number => {
  // Extract from voting_efficiency object (now guaranteed to exist)
  const approvalRate = dao.voting_efficiency?.approval_rate || 0
  const avgDurationDays = dao.voting_efficiency?.avg_voting_duration_days || 0
  const totalProposals = dao.voting_efficiency?.total_proposals || 0
  
  // Filter out DAOs with insufficient proposal data
  if (totalProposals < 3) return 1 // Minimum data requirement not met
  
  // Convert approval rate to percentage if needed (assume it's already in percentage)
  const approvalPercentage = approvalRate > 1 ? approvalRate : approvalRate * 100
  
  // Voting Efficiency scoring (1-3 points) based on research methodology:
  // High efficiency: >70% approval rate AND optimal duration (3-14 days)
  if (approvalPercentage > 70 && avgDurationDays >= 3 && avgDurationDays <= 14) {
    return 3 // High: >70% approval, 3-14 days duration
  }
  
  // Medium efficiency: 30-70% approval rate AND reasonable duration (3-14 days) 
  if (approvalPercentage >= 30 && approvalPercentage <= 70 && avgDurationDays >= 3 && avgDurationDays <= 14) {
    return 2 // Medium: 30-70% approval, 3-14 days duration
  }
  
  // Low efficiency: <30% approval rate OR sub-optimal duration (<3 days or >14 days)
  return 1 // Low: <30% approval or duration <3 days or >14 days
}

const calculateDecentralisation = (dao: any): number => {
  // Extract from decentralisation object (now guaranteed to exist)
  const largestHolderPercent = dao.decentralisation?.largest_holder_percent || 100
  const totalMembers = dao.network_participation?.total_members || 0
  const numDistinctVoters = dao.network_participation?.num_distinct_voters || 0
  const onChainAutomation = dao.decentralisation?.on_chain_automation || false
  
  // Handle automation field which can be string or boolean
  const isAutomated = onChainAutomation === true || onChainAutomation === "Yes" || onChainAutomation === "yes"
  
  // Calculate participation rate
  const participationRate = totalMembers > 0 ? (numDistinctVoters / totalMembers) * 100 : 0
  
  // Filter out anomalous data (participation > 100% indicates data quality issues)
  const validParticipationRate = participationRate > 100 ? 0 : participationRate
  
  // Decentralisation scoring (0.6-3 points) based on research methodology:
  
  // High decentralisation: largest holder <10%
  if (largestHolderPercent < 10) {
    return 3 // High: largest holder <10%
  }
  
  // Medium decentralisation ranges: largest holder 10-33%
  if (largestHolderPercent >= 10 && largestHolderPercent < 33) {
    const hasHighParticipation = validParticipationRate > 40
    const hasMediumParticipation = validParticipationRate >= 10
    
    // Medium-High: 10-33% largest holder + (medium/high participation AND full automation)
    if ((hasHighParticipation || hasMediumParticipation) && isAutomated) {
      return 2.4 // Medium-High: good participation + fully automated
    } else {
      return 1.8 // Medium: decent concentration but not fully optimized
    }
  }
  
  // Medium-Low decentralisation: largest holder 33-66%
  if (largestHolderPercent >= 33 && largestHolderPercent <= 66) {
    return 1.2 // Medium-Low: 33-66% largest holder
  }
  
  // Low decentralisation: largest holder >66%
  return 0.6 // Low: largest holder >66%
}

const calculateOverallScore = (metrics: Omit<SustainabilityMetrics, 'overall_score' | 'sustainability_level'>): number => {
  // Equal weights for all KPIs - simple sum
  return metrics.network_participation + metrics.accumulated_funds + metrics.voting_efficiency + metrics.decentralisation
}

const getSustainabilityLevel = (score: number): 'High' | 'Medium' | 'Low' => {
  if (score >= 9) return 'High'      // High Sustainability: ≥9 points
  if (score >= 6) return 'Medium'    // Medium Sustainability: 6-8.9 points
  return 'Low'                       // Low Sustainability: <6 points
}

export function SustainabilityDashboard() {
  const [searchInput, setSearchInput] = useState("") // Local input state
  const [chainFilter, setChainFilter] = useState<string | undefined>(undefined)
  const [levelFilter, setLevelFilter] = useState<string | undefined>(undefined)
  const [sortBy, setSortBy] = useState<keyof SustainabilityMetrics>('overall_score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Debounce the search input to avoid immediate API calls
  const debouncedSearchQuery = useDebounce(searchInput, 500) // 500ms delay
  
  const { data, isLoading, error } = useSustainabilityData({ 
    searchQuery: debouncedSearchQuery || undefined,
    chainId: chainFilter,
    limit: 100 // Get more data for comprehensive analysis
  })

  const daosWithSustainability = useMemo((): DAOWithSustainability[] => {
    if (!data) return []
    
    return data.map(dao => {
      // Calculate individual metrics
      const network_participation = calculateNetworkParticipation(dao)
      const accumulated_funds = calculateAccumulatedFunds(dao)
      const voting_efficiency = calculateVotingEfficiency(dao)
      const decentralisation = calculateDecentralisation(dao)
      
      // Calculate overall score
      const overall_score = calculateOverallScore({
        network_participation,
        accumulated_funds,
        voting_efficiency,
        decentralisation
      })
      
      const sustainability_level = getSustainabilityLevel(overall_score)
      
      return {
        ...dao,
        metrics: {
          network_participation,
          accumulated_funds,
          voting_efficiency,
          decentralisation,
          overall_score,
          sustainability_level
        }
      }
    })
  }, [data])

  const filteredDAOs = useMemo(() => {
    let filtered = daosWithSustainability
    
    if (debouncedSearchQuery) {
      filtered = filtered.filter(dao => 
        dao.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      )
    }
    
    if (levelFilter && levelFilter !== 'all') {
      filtered = filtered.filter(dao => dao.metrics.sustainability_level === levelFilter)
    }
    
    // Sort
    filtered.sort((a, b) => {
      const aValue = a.metrics[sortBy] as number
      const bValue = b.metrics[sortBy] as number
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue
    })
    
    return filtered
  }, [daosWithSustainability, debouncedSearchQuery, levelFilter, sortBy, sortOrder])

  const statistics = useMemo(() => {
    if (daosWithSustainability.length === 0) return null
    
    const high = daosWithSustainability.filter(d => d.metrics.sustainability_level === 'High').length
    const medium = daosWithSustainability.filter(d => d.metrics.sustainability_level === 'Medium').length
    const low = daosWithSustainability.filter(d => d.metrics.sustainability_level === 'Low').length
    const avgScore = daosWithSustainability.reduce((sum, d) => sum + d.metrics.overall_score, 0) / daosWithSustainability.length
    
    return { high, medium, low, avgScore, total: daosWithSustainability.length }
  }, [daosWithSustainability])

  const handleSort = (field: keyof SustainabilityMetrics) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const getSustainabilityColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-green-600 bg-green-50 border-green-200'
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'Low': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getScoreColor = (score: number, kpi: string) => {
    switch (kpi) {
      case 'network_participation':
        if (score >= 3) return 'text-green-600'
        if (score >= 2) return 'text-yellow-600'
        return 'text-red-600'
      case 'accumulated_funds':
        if (score >= 2.25) return 'text-green-600'
        if (score >= 1.5) return 'text-yellow-600'
        return 'text-red-600'
      case 'voting_efficiency':
        if (score >= 3) return 'text-green-600'
        if (score >= 2) return 'text-yellow-600'
        return 'text-red-600'
      case 'decentralisation':
        if (score >= 2.4) return 'text-green-600'
        if (score >= 1.8) return 'text-yellow-600'
        return 'text-red-600'
      case 'overall':
        if (score >= 9) return 'text-green-600'
        if (score >= 6) return 'text-yellow-600'
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatKPIDisplay = (dao: DAOWithSustainability, kpi: keyof SustainabilityMetrics) => {
    const score = dao.metrics[kpi] as number
    
    switch (kpi) {
      case 'network_participation':
        // Extract participation data from nested object (now guaranteed to exist)
        const totalMembers = dao.network_participation?.total_members || 0
        const numDistinctVoters = dao.network_participation?.num_distinct_voters || 0
        const participationRate = totalMembers > 0 ? (numDistinctVoters / totalMembers * 100) : 0
        return `${score.toFixed(1)}/3\n${participationRate.toFixed(1)}%`
        
      case 'accumulated_funds':
        // Extract treasury data from nested object (now guaranteed to exist)
        const treasuryValue = dao.accumulated_funds?.treasury_value_usd || 0
        const circulatingSupply = dao.accumulated_funds?.circulating_supply || 0
        const totalSupply = dao.accumulated_funds?.total_supply || 0
        
        const treasuryFormatted = treasuryValue >= 1000000000 ? `$${(treasuryValue / 1000000000).toFixed(1)}B` :
          treasuryValue >= 1000000 ? `$${(treasuryValue / 1000000).toFixed(1)}M` :
          treasuryValue >= 1000 ? `$${(treasuryValue / 1000).toFixed(1)}K` :
          `$${treasuryValue}`
          
        const circulatingPercentage = totalSupply > 0 && circulatingSupply > 0 ? 
          (circulatingSupply / totalSupply * 100) : (dao.accumulated_funds?.circulating_token_percentage || 100)
        return `${score.toFixed(2)}/3\n${treasuryFormatted} / ${circulatingPercentage.toFixed(1)}%`
        
      case 'voting_efficiency':
        // Extract voting data from nested object (now guaranteed to exist)
        const approvalRate = dao.voting_efficiency?.approval_rate || 0
        const avgDurationDays = dao.voting_efficiency?.avg_voting_duration_days || 0
        const approvalPercentage = approvalRate > 1 ? approvalRate : approvalRate * 100
        return `${score.toFixed(1)}/3\n${approvalPercentage.toFixed(1)}% / ${avgDurationDays.toFixed(1)}d`
        
      case 'decentralisation':
        // Extract decentralisation data from nested object (now guaranteed to exist)
        const largestHolder = dao.decentralisation?.largest_holder_percent || 100
        const onChainAutomation = dao.decentralisation?.on_chain_automation || false
        const isAutomated = onChainAutomation === true || onChainAutomation === "Yes" || onChainAutomation === "yes"
        const automationText = isAutomated ? 'Yes' : 'No'
        return `${score.toFixed(1)}/3\n${largestHolder.toFixed(1)}% / ${automationText}`
        
      default:
        return score.toFixed(1)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <LoadingIcon size="lg" className="animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Calculating sustainability scores...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <ErrorIcon size="lg" className="mx-auto text-red-500" />
          <div>
            <h3 className="text-lg font-semibold">Error Loading Data</h3>
            <p className="text-muted-foreground">Unable to load DAO data for sustainability analysis</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-card border border-border/50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <SustainabilityIcon size="sm" className="text-primary" />
              <div>
                <p className="text-sm font-medium">Total DAOs</p>
                <p className="text-2xl font-bold">{statistics.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card border border-border/50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">High Sustainability</p>
                <p className="text-2xl font-bold text-green-600">{statistics.high}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card border border-border/50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Minus className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Medium Sustainability</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.medium}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card border border-border/50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Low Sustainability</p>
                <p className="text-2xl font-bold text-red-600">{statistics.low}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card border border-border/50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <SustainabilityIcon size="sm" className="text-primary" />
              <div>
                <p className="text-sm font-medium">Average Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(statistics.avgScore, 'overall')}`}>
                  {statistics.avgScore.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-card border border-border/50 rounded-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search DAOs..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
              />
            </div>
          </div>
          
          <select
            value={chainFilter || 'all'}
            onChange={(e) => setChainFilter(e.target.value === 'all' ? undefined : e.target.value)}
            className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
          >
            <option value="all">All Chains</option>
            <option value="ethereum">Ethereum</option>
            <option value="polygon">Polygon</option>
            <option value="optimism">Optimism</option>
            <option value="arbitrum">Arbitrum</option>
          </select>
          
          <select
            value={levelFilter || 'all'}
            onChange={(e) => setLevelFilter(e.target.value === 'all' ? undefined : e.target.value)}
            className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
          >
            <option value="all">All Levels</option>
            <option value="High">High Sustainability</option>
            <option value="Medium">Medium Sustainability</option>
            <option value="Low">Low Sustainability</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-card border border-border/50 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left p-4 font-semibold">DAO Name</th>
                <th className="text-left p-4 font-semibold">Chain</th>
                <th 
                  className="text-center p-4 font-semibold cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => handleSort('network_participation')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <ParticipationIcon size="xs" />
                    Network Participation
                    {sortBy === 'network_participation' && (
                      <span className="text-xs">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-center p-4 font-semibold cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => handleSort('accumulated_funds')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <TreasuryIcon size="xs" />
                    Accumulated Funds
                    {sortBy === 'accumulated_funds' && (
                      <span className="text-xs">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-center p-4 font-semibold cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => handleSort('voting_efficiency')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <VotingIcon size="xs" />
                    Voting Efficiency
                    {sortBy === 'voting_efficiency' && (
                      <span className="text-xs">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-center p-4 font-semibold cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => handleSort('decentralisation')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <DecentralizationIcon size="xs" />
                    Decentralisation
                    {sortBy === 'decentralisation' && (
                      <span className="text-xs">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-center p-4 font-semibold cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => handleSort('overall_score')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <SustainabilityIcon size="xs" />
                    Overall Score
                    {sortBy === 'overall_score' && (
                      <span className="text-xs">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                    )}
                  </div>
                </th>
                <th className="text-center p-4 font-semibold">Sustainability Level</th>
              </tr>
            </thead>
            <tbody>
              {filteredDAOs.map((dao) => (
                <tr key={dao.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="font-medium">{dao.name}</div>
                    <div className="text-sm text-muted-foreground">ID: {dao.id}</div>
                  </td>
                  <td className="p-4">
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-muted/50 rounded capitalize">
                      {dao.chain_id}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className={`font-semibold ${getScoreColor(dao.metrics.network_participation, 'network_participation')}`}>
                      <div className="whitespace-pre-line text-sm">
                        {formatKPIDisplay(dao, 'network_participation')}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className={`font-semibold ${getScoreColor(dao.metrics.accumulated_funds, 'accumulated_funds')}`}>
                      <div className="whitespace-pre-line text-sm">
                        {formatKPIDisplay(dao, 'accumulated_funds')}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className={`font-semibold ${getScoreColor(dao.metrics.voting_efficiency, 'voting_efficiency')}`}>
                      <div className="whitespace-pre-line text-sm">
                        {formatKPIDisplay(dao, 'voting_efficiency')}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className={`font-semibold ${getScoreColor(dao.metrics.decentralisation, 'decentralisation')}`}>
                      <div className="whitespace-pre-line text-sm">
                        {formatKPIDisplay(dao, 'decentralisation')}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className={`text-lg font-bold ${getScoreColor(dao.metrics.overall_score, 'overall')}`}>
                      {dao.metrics.overall_score.toFixed(1)}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-3 py-1 text-sm font-medium border rounded-full ${getSustainabilityColor(dao.metrics.sustainability_level)}`}>
                      {dao.metrics.sustainability_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredDAOs.length === 0 && (
          <div className="text-center py-12">
            <EmptyStateIcon size="lg" className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No DAOs Found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Research Citation */}
      <div className="bg-card border border-border/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <SustainabilityIcon size="sm" />
          Research Methodology
        </h3>
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            This sustainability scoring methodology is based on academic research analyzing the long-term 
            viability and health of Decentralized Autonomous Organizations (DAOs).
          </p>
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Key Performance Indicators (KPIs) - Equal Weight:</h4>
            <ul className="space-y-1 ml-4">
              <li><strong>Network Participation (1-3 points):</strong> Low (&lt;10%): 1 point, Medium (10%-40%): 2 points, High (&gt;40%): 3 points</li>
              <li><strong>Accumulated Funds (0.75-3 points):</strong> Low (&lt;$100M): 0.75 points, Medium-Low ($100M-$1B, ≤50% circulating): 1.5 points, Medium-High ($100M-$1B, &gt;50% circulating): 2.25 points, High (&gt;$1B): 3 points</li>
              <li><strong>Voting Efficiency (1-3 points):</strong> Low (approval &lt;30% or duration &lt;3 days): 1 point, Medium (approval 30%-70%, duration 3-14 days): 2 points, High (approval &gt;70%, duration 3-14 days): 3 points</li>
              <li><strong>Decentralisation (0.6-3 points):</strong> Low (largest holder &gt;66%): 0.6 points, Medium-Low (largest holder 33%-66%): 1.2 points, Medium (largest holder 10%-33%, medium participation, not fully automated): 1.8 points, Medium-High (largest holder 10%-33%, medium/high participation, fully automated): 2.4 points, High (largest holder &lt;10%): 3 points</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Sustainability Levels (Total Score):</h4>
            <ul className="space-y-1 ml-4">
              <li><strong>Low Sustainability:</strong> &lt;6 points</li>
              <li><strong>Medium Sustainability:</strong> 6-8.9 points</li>
              <li><strong>High Sustainability:</strong> ≥9 points</li>
            </ul>
          </div>
          <p className="italic border-l-4 border-primary/20 pl-4 bg-muted/20 p-3 rounded">
            <strong>Citation:</strong> Meneguzzo, S., Schifanella, C., Gatteschi, V., & Destefanis, G. (2025). 
            <em>Evaluating DAO Sustainability and Longevity Through On-Chain Governance Metrics</em>. 
            arXiv preprint arXiv:2504.11341. 
            <a href="https://arxiv.org/abs/2504.11341" target="_blank" rel="noopener noreferrer" 
               className="text-primary hover:text-primary/80 underline">
              https://arxiv.org/abs/2504.11341
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
