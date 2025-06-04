// components/charts/SingleDAOCharts.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import ParticipationChart from './ParticipationChart';
import TokenDistributionChart from './TokenDistributionChart';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { useDAOMetrics } from '../../lib/hooks/useDAOMetrics';
import { TreasuryChart } from './TreasuryChart'; 
import { ProposalChart } from './ProposalChart';
import { ErrorIcon, ParticipationIcon, TokenIcon, TreasuryIcon, VotingIcon } from '../ui/icons';

interface SingleDAOChartsProps {
  daoId: number;
  daoName: string;
}

export const SingleDAOCharts: React.FC<SingleDAOChartsProps> = ({ daoId, daoName }) => {
  const { data: metricsData, isLoading, error } = useDAOMetrics(daoId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="relative">
          <div className="animate-spin h-12 w-12 border-4 border-primary/20 rounded-full border-t-primary"></div>
          <div className="absolute inset-0 animate-pulse h-12 w-12 border-4 border-transparent rounded-full border-t-primary/40"></div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-foreground">Loading Analytics</p>
          <p className="text-sm text-muted-foreground">Fetching detailed metrics for {daoName}...</p>
        </div>
      </div>
    );
  }

  if (error || !metricsData) {
    return (
      <div className="status-badge-error border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-6 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <ErrorIcon size="sm" />
          </div>
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">Metrics Unavailable</h3>
            <p className="text-sm text-red-700 dark:text-red-300">
              Error loading analytics data for {daoName}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <div className="chart-header">
        <div>
          <h2 className="chart-title">{daoName} Analytics Dashboard</h2>
          <p className="chart-subtitle">Comprehensive metrics and performance indicators</p>
        </div>
        <div className="status-badge status-badge-success">
          Live Data
        </div>
      </div>
      
      <Tabs defaultValue="participation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 backdrop-blur-sm">
          <TabsTrigger value="participation" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <div className="flex items-center gap-2">
              <ParticipationIcon size="sm" />
              Participation
            </div>
          </TabsTrigger>
          <TabsTrigger value="tokenDistribution" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <div className="flex items-center gap-2">
              <TokenIcon size="sm" />
              Tokens
            </div>
          </TabsTrigger>
          <TabsTrigger value="treasury" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <div className="flex items-center gap-2">
              <TreasuryIcon size="sm" />
              Treasury
            </div>
          </TabsTrigger>
          <TabsTrigger value="proposals" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <div className="flex items-center gap-2">
              <VotingIcon size="sm" />
              Proposals
            </div>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="participation" className="mt-6">
          <Card className="dao-card border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ParticipationIcon size="sm" />
                Network Participation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ParticipationChart data={metricsData.network_participation} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tokenDistribution" className="mt-6">
          <Card className="dao-card border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TokenIcon size="sm" />
                Token Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <TokenDistributionChart data={metricsData.decentralisation?.token_distribution} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="treasury" className="mt-6">
          <Card className="dao-card border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TreasuryIcon size="sm" />
                Treasury Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <TreasuryChart data={metricsData.accumulated_funds} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="proposals" className="mt-6">
          <Card className="dao-card border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <VotingIcon size="sm" />
                Proposal Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ProposalChart data={metricsData.voting_efficiency} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};