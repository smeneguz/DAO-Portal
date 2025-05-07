"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Search, ArrowUpDown } from "lucide-react"

// Define interface for DAO
interface DAO {
  id: number;
  name: string;
  chain_id: string;
  description: string | null;
  created_at: string;
}

// Define interface for DAO list response
interface DAOListResponse {
  items: DAO[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';


// Function to fetch DAOs directly
async function fetchDAOs(params: any = {}): Promise<DAOListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.name) queryParams.append('name', params.name);
    if (params.chain_id) queryParams.append('chain_id', params.chain_id);
    if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    // Direct API call to backend instead of using the proxy
    const response = await fetch(`${API_URL}/daos${queryString}`);
    if (!response.ok) {
      throw new Error('Failed to fetch DAOs');
    }
    return response.json();
}

export default function DAOListPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [chainFilter, setChainFilter] = useState<string | undefined>(undefined)
  
  const { data, isLoading, isError } = useQuery({
    queryKey: ["daos", { search: searchQuery, chain: chainFilter }],
    queryFn: () => fetchDAOs({ 
      name: searchQuery || undefined,
      chain_id: chainFilter
    }),
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
              <TableHeader>Created</TableHeader>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-muted-foreground">
                  Loading DAOs...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-destructive">
                  Error loading DAOs. Please try again.
                </td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-muted-foreground">
                  No DAOs found matching your criteria.
                </td>
              </tr>
            ) : (
              data?.items.map((dao) => (
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
                    {new Date(dao.created_at).toLocaleDateString()}
                  </TableCell>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex space-x-2">
            {Array.from({ length: data.pages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`px-3 py-1.5 rounded-md ${
                  page === data.page
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
                onClick={() => {
                  // Implement pagination logic
                }}
              >
                {page}
              </button>
            ))}
          </div>
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