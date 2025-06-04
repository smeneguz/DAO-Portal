"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, ArrowUpDown } from "lucide-react"
import { useDAOsQuery } from "../../lib/hooks/useDAOsQuery"
import {
  ErrorIcon,
  EmptyStateIcon,
  DecentralizationIcon,
  ParticipationIcon,
  TreasuryIcon,
  VotingIcon
} from "../../components/ui/icons"

export default function DAOListPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [chainFilter, setChainFilter] = useState<string | undefined>(undefined)
  const [currentOffset, setCurrentOffset] = useState(0)
  const limit = 20
  
  const { data, isLoading, error, totalCount } = useDAOsQuery({ 
    searchQuery: searchQuery || undefined,
    chainId: chainFilter,
    limit,
    offset: currentOffset
  })
  
  // Helper for chain filter options
  const chainOptions = [
    { value: undefined, label: "All Chains" },
    { value: "ethereum", label: "Ethereum" },
    { value: "polygon", label: "Polygon" },
    { value: "optimism", label: "Optimism" },
    { value: "arbitrum", label: "Arbitrum" },
  ]
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/98 to-muted/20 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
      
      <div className="container mx-auto py-8 px-4 max-w-7xl relative z-10 space-y-8">
        {/* Header */}
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            DAO Explorer
          </h1>
          <p className="text-muted-foreground mt-2">
            Browse and analyze all DAOs in our database
          </p>
        </div>
        
        {/* Filters */}
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search DAOs..."
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 min-w-[140px] bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              value={chainFilter}
              onChange={(e) => setChainFilter(e.target.value || undefined)}
            >
              {chainOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* DAO Table */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-sm border border-border/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <TableHeader>Name</TableHeader>
                <TableHeader>Chain</TableHeader>
                <TableHeader>Members</TableHeader>
                <TableHeader>Treasury (USD)</TableHeader>
                <TableHeader>Participation Rate</TableHeader>
                <TableHeader>Proposals</TableHeader>
                <TableHeader>Created</TableHeader>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative">
                        <div className="animate-spin h-8 w-8 border-4 border-primary/20 rounded-full border-t-primary"></div>
                        <div className="absolute inset-0 animate-pulse h-8 w-8 border-4 border-transparent rounded-full border-t-primary/40"></div>
                      </div>
                      <p className="mt-3 text-muted-foreground">Loading DAOs...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center mb-3">
                        <ErrorIcon className="text-destructive" />
                      </div>
                      <p className="text-destructive font-medium">Error loading DAOs</p>
                      <p className="text-muted-foreground text-sm mt-1">Please try again later</p>
                    </div>
                  </td>
                </tr>
              ) : !data || data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <EmptyStateIcon className="text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">No DAOs found</p>
                      <p className="text-muted-foreground text-sm mt-1">Try adjusting your search criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((dao) => (
                  <tr key={dao.id} className="group hover:bg-gradient-to-r hover:from-muted/20 hover:to-transparent transition-all duration-150 border-b border-border/30 last:border-b-0">
                    <TableCell>
                      <Link href={`/dao/${dao.id}`} className="text-primary hover:underline font-semibold flex items-center gap-3 group-hover:text-primary/80 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/20 group-hover:border-primary/30 transition-colors flex-shrink-0">
                          <span className="text-xs font-bold text-primary">{dao.name.charAt(0)}</span>
                        </div>
                        <span className="font-semibold">{dao.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
                        <DecentralizationIcon size="xs" />
                        Chain {dao.chain_id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ParticipationIcon className="text-muted-foreground" size="xs" />
                        <span className="font-medium text-foreground">
                          {dao.total_members ? dao.total_members.toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TreasuryIcon className="text-muted-foreground" size="xs" />
                        <span className="font-medium">
                          {dao.treasury_value_usd ? `$${dao.treasury_value_usd.toLocaleString()}` : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          dao.participation_rate 
                            ? dao.participation_rate > 10 
                              ? 'bg-green-500' 
                              : dao.participation_rate > 5 
                                ? 'bg-yellow-500' 
                                : 'bg-red-500'
                            : 'bg-gray-300'
                        }`}></div>
                        <span className="font-medium">
                          {dao.participation_rate ? `${(dao.participation_rate * 100).toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <VotingIcon className="text-muted-foreground" size="xs" />
                        <span className="font-medium">
                          {dao.total_proposals ? dao.total_proposals.toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {new Date(dao.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalCount > limit && (
          <div className="flex justify-center">
            <div className="flex space-x-2">
              {Array.from({ length: Math.ceil(totalCount / limit) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    page === Math.floor(currentOffset / limit) + 1
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => {
                    setCurrentOffset((page - 1) * limit);
                  }}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {data && (
          <div className="text-sm text-muted-foreground text-center">
            Showing {data.length} of {totalCount} DAOs
          </div>
        )}
      </div>
    </div>
  )
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <ArrowUpDown className="h-4 w-4" />
      </div>
    </th>
  )
}

function TableCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-4 py-3 align-middle">{children}</td>
  )
}