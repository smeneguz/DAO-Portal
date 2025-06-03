"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, ArrowUpDown } from "lucide-react"
import { useDAOs } from "../../lib/hooks/useDAOs"

export default function DAOListPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [chainFilter, setChainFilter] = useState<string | undefined>(undefined)
  const [currentOffset, setCurrentOffset] = useState(0)
  const limit = 20
  
  const { data, isLoading, error, totalCount } = useDAOs({ 
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">DAO Explorer</h1>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search DAOs..."
            className="pl-10 pr-4 py-2 w-full rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
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
      
      {/* DAO Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
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
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  Loading DAOs...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-destructive">
                  Error loading DAOs. Please try again.
                </td>
              </tr>
            ) : !data || data.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  No DAOs found matching your criteria.
                </td>
              </tr>
            ) : (
              data.map((dao) => (
                <tr key={dao.id} className="border-t hover:bg-muted/50">
                  <TableCell>
                    <Link href={`/dao/${dao.id}`} className="text-primary hover:underline font-medium">
                      {dao.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                      {dao.chain_id}
                    </span>
                  </TableCell>
                  <TableCell>
                    {dao.total_members ? dao.total_members.toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {dao.treasury_value_usd ? `$${dao.treasury_value_usd.toLocaleString()}` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {dao.participation_rate ? `${(dao.participation_rate * 100).toFixed(1)}%` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {dao.total_proposals ? dao.total_proposals.toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {new Date(dao.created_at).toLocaleDateString()}
                  </TableCell>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalCount > limit && (
        <div className="flex justify-center mt-6">
          <div className="flex space-x-2">
            {Array.from({ length: Math.ceil(totalCount / limit) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`px-3 py-1.5 rounded-md ${
                  page === Math.floor(currentOffset / limit) + 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
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