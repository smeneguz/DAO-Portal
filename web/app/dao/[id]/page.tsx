// app/dao/[id]/page.tsx
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { SingleDAOCharts } from '../../../components/charts/SingleDAOCharts';
import { useDAO } from '../../../lib/hooks/useDAO';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import Link from 'next/link';
import { useDAOSelection } from '../../../lib/context/DAOSelectionContext';
import {
  ErrorIcon,
  BackIcon,
  DashboardIcon,
  DecentralizationIcon,
  SuccessIcon,
  InfoIcon,
  AnalyticsIcon,
  AddIcon
} from '../../../components/ui/icons';

export default function DAODetail() {
  const { id } = useParams();
  const daoId = parseInt(id as string, 10);
  const { data: dao, isLoading, error } = useDAO(daoId);
  const { isDAOSelected, toggleDAOSelection } = useDAOSelection();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="page-container">
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="relative">
              <div className="animate-spin h-12 w-12 border-4 border-primary/20 rounded-full border-t-primary"></div>
              <div className="absolute inset-0 animate-pulse h-12 w-12 border-4 border-transparent rounded-full border-t-primary/40"></div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-foreground">Loading DAO Details</p>
              <p className="text-sm text-muted-foreground">Fetching comprehensive data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dao) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="page-container">
          <div className="status-badge-error border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-8 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <ErrorIcon className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">Failed to Load DAO</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                  {error?.message || "Failed to load DAO data"}
                </p>
                <Link href="/dao">
                  <Button className="btn-secondary">
                    <BackIcon className="mr-2" size="sm" />
                    Return to DAOs list
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/30">
      <div className="page-container fade-in">
        {/* Enhanced Header */}
        <div className="glass-header sticky top-0 z-10 -mx-4 px-4 py-6 mb-8 rounded-b-2xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <Link href="/dao" className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted/20">
                  <BackIcon />
                </Link>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-purple-600 flex items-center justify-center shadow-lg">
                    <DashboardIcon className="text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary via-primary/90 to-purple-600 bg-clip-text text-transparent">
                      {dao.name}
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="status-badge status-badge-neutral">
                        <DecentralizationIcon className="mr-1" size="sm" />
                        Chain {dao.chain_id}
                      </span>
                      {isDAOSelected(daoId) && (
                        <span className="status-badge status-badge-success animate-pulse">
                          <SuccessIcon className="mr-1" size="sm" />
                          Selected for Comparison
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant={isDAOSelected(daoId) ? "default" : "outline"}
                onClick={() => toggleDAOSelection(daoId)}
                className={`h-10 px-6 transition-all duration-200 ${
                  isDAOSelected(daoId) 
                    ? "btn-gradient shadow-lg hover:shadow-xl transform hover:scale-105" 
                    : "border-2 hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                {isDAOSelected(daoId) ? (
                  <>
                    <SuccessIcon className="mr-2" size="sm" />
                    Selected for Comparison
                  </>
                ) : (
                  <>
                    <AddIcon className="mr-2" size="sm" />
                    Add to Comparison
                  </>
                )}
              </Button>
              <Link href="/dao/compare">
                <Button variant="outline" className="h-10 px-6 border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200">
                  <AnalyticsIcon className="mr-2" size="sm" />
                  Compare DAOs
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {dao.description && (
          <div className="glass-surface p-8 rounded-2xl mb-8 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 via-primary/10 to-purple-500/10 flex items-center justify-center">
                <InfoIcon className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-3 text-foreground">About {dao.name}</h2>
                <p className="text-muted-foreground leading-relaxed text-base">{dao.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Charts Section */}
        <div className="space-y-8">
          <SingleDAOCharts daoId={daoId} daoName={dao.name} />
        </div>
      </div>
    </div>
  );
}
