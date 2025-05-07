"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { useState } from "react"

// Define interface for DAO
interface DAO {
  id: number;
  name: string;
  chain_id: string;
  description: string | null;
  created_at: string;
}

// Define interface for Metrics
interface Metrics {
  dao_id: number;
  dao_name: string;
  metrics: {
    network_participation?: {
      participation_rate: number;
      num_distinct_voters: number;
      total_members: number;
      unique_proposers: number;
    };
    accumulated_funds?: {
      treasury_value_usd: number;
      circulating_supply: number;
      total_supply: number;
      circulating_token_percentage: number;
      token_velocity: number;
    };
    voting_efficiency?: {
      total_proposals: number;
      approved_proposals: number;
      approval_rate: number;
      avg_voting_duration_days: number;
    };
    decentralisation?: {
      largest_holder_percent: number;
      on_chain_automation: string;
      token_distribution: {
        "0-1": number;
        "1-10": number;
        "10-100": number;
        "100-1000": number;
        "1000-10000": number;
        "10000+": number;
      };
      proposer_concentration: number;
    };
    health_metrics?: {
      network_health_score: number;
      activity_ratio: number;
      total_volume: number;
      mean_daily_volume: number;
    };
  };
}

// Direct fetch functions
async function fetchDAO(id: number): Promise<DAO> {
    // Remove the extra v1 from the path
    const response = await fetch(`/api/v1/daos/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch DAO');
    }
    return response.json();
  }
  
async function fetchMetrics(id: number): Promise<Metrics> {
try {
    // Remove the extra v1 from the path
    const response = await fetch(`/api/v1/daos/${id}/enhanced-metrics`);
    if (response.ok) {
    return response.json();
    }
    
    // Remove the extra v1 from the path
    const basicResponse = await fetch(`/api/v1/daos/${id}/metrics`);
    if (basicResponse.ok) {
    return basicResponse.json();
    }
    
    throw new Error('Failed to fetch metrics');
} catch (error) {
    console.error("Error fetching metrics:", error);
    throw error;
}
}

export default function DAODetailPage() {
  const params = useParams()
  const router = useRouter()
  const daoId = Number(params.id)
  const [periodFilter, setPeriodFilter] = useState("30d")
  
  // DAO data query
  const { data: dao, isLoading: isLoadingDao, error: daoError } = useQuery({
    queryKey: ["dao", daoId],
    queryFn: () => fetchDAO(daoId),
    enabled: !isNaN(daoId),
  })
  
  // DAO metrics query
  const { 
    data: metrics, 
    isLoading: isLoadingMetrics, 
    error: metricsError,
    refetch: refetchMetrics
  } = useQuery({
    queryKey: ["dao-metrics", daoId, periodFilter],
    queryFn: () => fetchMetrics(daoId),
    enabled: !isNaN(daoId),
  })
  
  const isLoading = isLoadingDao || isLoadingMetrics
  const error = daoError || metricsError
  
  if (isLoading) {
    return <div className="p-12 text-center">Loading DAO information...</div>
  }
  
  if (error || !dao) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h1 className="text-2xl font-bold mb-4">DAO not found</h1>
        <p className="text-muted-foreground mb-6">
          The DAO you're looking for doesn't exist or has been removed.
        </p>
        <Link 
          href="/dao" 
          className="flex items-center text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to DAO List
        </Link>
      </div>
    )
  }
  
  // Extract metrics data
  const networkParticipation = metrics?.metrics?.network_participation || {}
  const accumulatedFunds = metrics?.metrics?.accumulated_funds || {}
  const votingEfficiency = metrics?.metrics?.voting_efficiency || {}
  const decentralisation = metrics?.metrics?.decentralisation || {}
  const healthMetrics = metrics?.metrics?.health_metrics || {}
  
  return (
    <div className="space-y-8">
      {/* Header with back link and DAO name */}
      <div className="flex flex-col space-y-2">
        <Link 
          href="/dao" 
          className="flex items-center text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to All DAOs
        </Link>
        
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            {dao.name}
          </h1>
          
          <button 
            onClick={() => refetchMetrics()}
            className="flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-2" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
            </svg>
            Refresh Metrics
          </button>
        </div>
        
        {dao.description && (
          <p className="text-muted-foreground max-w-2xl">
            {dao.description}
          </p>
        )}
        
        {/* Chain badge */}
        {dao.chain_id && (
          <div className="flex items-center mt-1">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {dao.chain_id}
            </span>
          </div>
        )}
      </div>
      
      {/* Period filter */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Time period:</span>
        {["30d", "90d", "180d", "365d"].map((period) => (
          <button
            key={period}
            className={`px-3 py-1.5 text-sm rounded-md ${
              period === periodFilter
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
            onClick={() => setPeriodFilter(period)}
          >
            {period}
          </button>
        ))}
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Participation Rate"
          value={`${((networkParticipation.participation_rate || 0) * 1).toFixed(2)}%`}
          description={`${networkParticipation.num_distinct_voters || 0} of ${networkParticipation.total_members || 0} members`}
        />
        <MetricCard 
          title="Treasury Value"
          value={`$${Number(accumulatedFunds.treasury_value_usd || 0).toLocaleString()}`}
          description="Total value in USD"
        />
        <MetricCard 
          title="Proposals"
          value={`${votingEfficiency.approved_proposals || 0}/${votingEfficiency.total_proposals || 0}`}
          description={`${votingEfficiency.approval_rate?.toFixed(1) || 0}% approval rate`}
        />
        <MetricCard 
          title="Health Score"
          value={`${(healthMetrics.network_health_score || 0).toFixed(1)}`}
          description="Overall DAO health rating"
        />
      </div>
      
      {/* Data tables */}
      <div className="space-y-8">
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted px-4 py-3 border-b">
            <h3 className="text-lg font-medium">Network Participation</h3>
          </div>
          <div className="p-4">
            <table className="w-full">
              <tbody>
                <DataRow label="Active Voters" value={networkParticipation.num_distinct_voters?.toLocaleString() || "0"} />
                <DataRow label="Total Members" value={networkParticipation.total_members?.toLocaleString() || "0"} />
                <DataRow label="Participation Rate" value={`${((networkParticipation.participation_rate || 0) * 1).toFixed(2)}%`} />
                <DataRow label="Unique Proposers" value={networkParticipation.unique_proposers?.toString() || "0"} />
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted px-4 py-3 border-b">
            <h3 className="text-lg font-medium">Treasury</h3>
          </div>
          <div className="p-4">
            <table className="w-full">
              <tbody>
                <DataRow label="Treasury Value (USD)" value={`$${Number(accumulatedFunds.treasury_value_usd || 0).toLocaleString()}`} />
                <DataRow label="Circulating Supply" value={Number(accumulatedFunds.circulating_supply || 0).toLocaleString()} />
                <DataRow label="Total Supply" value={Number(accumulatedFunds.total_supply || 0).toLocaleString()} />
                <DataRow label="Circulating %" value={`${(accumulatedFunds.circulating_token_percentage || 0).toFixed(2)}%`} />
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted px-4 py-3 border-b">
            <h3 className="text-lg font-medium">Governance</h3>
          </div>
          <div className="p-4">
            <table className="w-full">
              <tbody>
                <DataRow label="Total Proposals" value={votingEfficiency.total_proposals?.toString() || "0"} />
                <DataRow label="Approved Proposals" value={votingEfficiency.approved_proposals?.toString() || "0"} />
                <DataRow label="Approval Rate" value={`${(votingEfficiency.approval_rate || 0).toFixed(2)}%`} />
                <DataRow label="Avg. Duration" value={`${(votingEfficiency.avg_voting_duration_days || 0).toFixed(1)} days`} />
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted px-4 py-3 border-b">
            <h3 className="text-lg font-medium">Decentralization</h3>
          </div>
          <div className="p-4">
            <table className="w-full">
              <tbody>
                <DataRow label="Largest Holder %" value={`${(decentralisation.largest_holder_percent || 0).toFixed(2)}%`} />
                <DataRow label="On-chain Automation" value={decentralisation.on_chain_automation || "N/A"} />
                <DataRow label="Proposer Concentration" value={`${(decentralisation.proposer_concentration || 0).toFixed(2)}%`} />
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted px-4 py-3 border-b">
            <h3 className="text-lg font-medium">Health Metrics</h3>
          </div>
          <div className="p-4">
            <table className="w-full">
              <tbody>
                <DataRow label="Network Health Score" value={(healthMetrics.network_health_score || 0).toFixed(2)} />
                <DataRow label="Activity Ratio" value={(healthMetrics.activity_ratio || 0).toFixed(4)} />
                <DataRow label="Total Volume" value={Number(healthMetrics.total_volume || 0).toLocaleString()} />
                <DataRow label="Mean Daily Volume" value={Number(healthMetrics.mean_daily_volume || 0).toLocaleString()} />
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Token Distribution */}
        {decentralisation.token_distribution && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-3 border-b">
              <h3 className="text-lg font-medium">Token Distribution</h3>
            </div>
            <div className="p-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Token Range</th>
                    <th className="text-right py-2 px-2">Number of Holders</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(decentralisation.token_distribution).map(([range, count]) => (
                    <tr key={range} className="border-b">
                      <td className="py-2 px-2">{range}</td>
                      <td className="text-right py-2 px-2">{Number(count).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b">
      <td className="py-2 px-2 font-medium">{label}</td>
      <td className="py-2 px-2 text-right">{value}</td>
    </tr>
  )
}