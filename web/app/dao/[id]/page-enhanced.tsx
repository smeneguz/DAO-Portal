'use client';

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { MetricsDashboard } from "../../../components/dao/MetricsDashboard";

export default function EnhancedDaoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const daoId = Number(params.id);
  
  // DAO data query
  const { data: dao, isLoading: isLoadingDao, error } = useQuery({
    queryKey: ["dao", daoId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/daos/${daoId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch DAO');
      }
      return response.json();
    },
    enabled: !isNaN(daoId),
  });
  
  if (isLoadingDao) {
    return <div className="p-12 text-center">Loading DAO information...</div>;
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
    );
  }
  
  return (
    <div className="space-y-8 pb-16">
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
      
      {/* Enhanced Metrics Dashboard */}
      <MetricsDashboard daoId={daoId} />
    </div>
  );
}