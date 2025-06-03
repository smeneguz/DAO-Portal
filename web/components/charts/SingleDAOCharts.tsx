// components/charts/SingleDAOCharts.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import ParticipationChart from './ParticipationChart';
import TokenDistributionChart from './TokenDistributionChart';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { useDAOMetrics } from '../../lib/hooks/useDAOMetrics';
import { TreasuryChart } from './TreasuryChart'; 
import { ProposalChart } from './ProposalChart';

interface SingleDAOChartsProps {
  daoId: number;
  daoName: string;
}

export const SingleDAOCharts: React.FC<SingleDAOChartsProps> = ({ daoId, daoName }) => {
  const { data: metricsData, isLoading, error } = useDAOMetrics(daoId);

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading metrics...</div>;
  }

  if (error || !metricsData) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-500">Error loading DAO metrics</p>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">{daoName} Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="participation">
          <TabsList className="mb-4">
            <TabsTrigger value="participation">Participation</TabsTrigger>
            <TabsTrigger value="tokenDistribution">Token Distribution</TabsTrigger>
            <TabsTrigger value="treasury">Treasury</TabsTrigger>
            <TabsTrigger value="proposals">Proposals</TabsTrigger>
          </TabsList>
          
          <TabsContent value="participation">
            <div className="h-80">
              <ParticipationChart data={metricsData.network_participation} />
            </div>
          </TabsContent>
          
          <TabsContent value="tokenDistribution">
            <div className="h-80">
              <TokenDistributionChart data={metricsData.decentralisation?.token_distribution} />
            </div>
          </TabsContent>
          
          <TabsContent value="treasury">
            <div className="h-80">
              <TreasuryChart data={metricsData.accumulated_funds} />
            </div>
          </TabsContent>
          
          <TabsContent value="proposals">
            <div className="h-80">
              <ProposalChart data={metricsData.voting_efficiency} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};