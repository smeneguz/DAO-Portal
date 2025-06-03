// web/components/layout/DAODetailsLayout.tsx
'use client';

import Link from "next/link";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { ReactNode } from "react";

interface DAODetailsLayoutProps {
  daoName: string;
  daoDescription?: string | null;
  daoChainId?: string;
  onRefresh?: () => void;
  children: ReactNode;
}

export function DAODetailsLayout({ 
  daoName, 
  daoDescription, 
  daoChainId, 
  onRefresh, 
  children 
}: DAODetailsLayoutProps) {
  return (
    <div className="space-y-8">
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
            {daoName}
          </h1>
          
          {onRefresh && (
            <button 
              onClick={onRefresh}
              className="flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Metrics
            </button>
          )}
        </div>
        
        {daoDescription && (
          <p className="text-muted-foreground max-w-2xl">
            {daoDescription}
          </p>
        )}
        
        {daoChainId && (
          <div className="flex items-center mt-1">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {daoChainId}
            </span>
          </div>
        )}
      </div>
      
      {children}
    </div>
  );
}