// components/charts/SingleDAOCharts.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import ParticipationChart from './ParticipationChart';
import TokenDistributionChart from './TokenDistributionChart';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { useDAOMetrics } from '../../lib/hooks/useDAOMetrics';
import { TreasuryChart } from './TreasuryChart'; 
import { ProposalChart } from './ProposalChart';
import TreasuryAnalysis from '../visualization/KPIAnalysis/TreasuryAnalysis/TreasuryAnalysis';
import ParticipationAnalysis from '../visualization/KPIAnalysis/ParticipationAnalysis/ParticipationAnalysis';
import ThresholdAnalysis from '../visualization/KPIAnalysis/ThresholdAnalysis/ThresholdAnalysis';
import VotingEfficiencyAnalysis from '../visualization/KPIAnalysis/VotingEfficiencyAnalysis/VotingEfficiencyAnalysis';
import { ErrorIcon, ParticipationIcon, TokenIcon, TreasuryIcon, VotingIcon, AnalyticsIcon } from '../ui/icons';

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
      </div>
      
      <Tabs defaultValue="participation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-muted/50 backdrop-blur-sm">
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
          <TabsTrigger value="advanced" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <div className="flex items-center gap-2">
              <AnalyticsIcon size="sm" />
              Advanced
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

        <TabsContent value="advanced" className="mt-6">
          <div className="space-y-8">
            <TreasuryAnalysis 
              data={[{
                name: daoName,
                treasury_value_usd: metricsData.accumulated_funds?.treasury_value_usd || 0,
                circulating_token_percentage: metricsData.accumulated_funds?.circulating_token_percentage || 0,
                total_supply: metricsData.accumulated_funds?.total_supply || 0,
                token_velocity: metricsData.accumulated_funds?.token_velocity || 0,
                total_members: metricsData.network_participation?.total_members || 0,
                chain_id: metricsData.chain_id
              }]}
              mode="single"
              title={`${daoName} Treasury Analysis`}
            />
            
            <ParticipationAnalysis 
              data={[{
                name: daoName,
                total_members: metricsData.network_participation?.total_members || 0,
                num_distinct_voters: metricsData.network_participation?.num_distinct_voters || 0,
                unique_proposers: metricsData.network_participation?.unique_proposers || 0,
                participation_rate: metricsData.network_participation?.participation_rate || 0,
                chain_id: metricsData.chain_id
              }]}
              mode="single"
              title={`${daoName} Participation Analysis`}
            />
            
            <ThresholdAnalysis 
              data={[{
                name: daoName,
                total_members: metricsData.network_participation?.total_members || 0,
                num_distinct_voters: metricsData.network_participation?.num_distinct_voters || 0,
                health_score: metricsData.health_score || 0,
                treasury_value: metricsData.accumulated_funds?.treasury_value_usd || 0,
                participation_rate: metricsData.network_participation?.participation_rate || 0,
                chain_id: metricsData.chain_id
              }]}
              mode="single"
              title={`${daoName} Threshold Analysis`}
            />
            
            <VotingEfficiencyAnalysis 
              data={[{
                name: daoName,
                voting_efficiency: {
                  approval_rate: metricsData.voting_efficiency?.approval_rate || 0,
                  avg_voting_duration_days: metricsData.voting_efficiency?.avg_voting_duration_days || 0,
                  total_proposals: metricsData.voting_efficiency?.total_proposals || 0,
                  approved_proposals: metricsData.voting_efficiency?.approved_proposals || 0
                },
                chain_id: metricsData.chain_id
              }]}
              mode="single"
              title={`${daoName} Voting Efficiency Analysis`}
            />
            
            {/* Coming Soon Section */}
            <Card className="dao-card border-none shadow-lg bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-400">🚀</span>
                  </div>
                  Coming Soon
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                    Preview
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    We're continuously expanding our analytics capabilities. Here's what's coming next to enhance your DAO insights:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-dashed border-purple-200 dark:border-purple-800/50 bg-white/50 dark:bg-gray-900/50">
                      <h4 className="font-semibold text-sm mb-2 text-purple-700 dark:text-purple-300">
                        🎯 Governance Impact Analysis
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Analyze the real-world impact of governance decisions and proposal outcomes on DAO performance metrics.
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg border border-dashed border-blue-200 dark:border-blue-800/50 bg-white/50 dark:bg-gray-900/50">
                      <h4 className="font-semibold text-sm mb-2 text-blue-700 dark:text-blue-300">
                        📊 Predictive Analytics
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        ML-powered forecasting for treasury growth, participation trends, and governance health scores.
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg border border-dashed border-green-200 dark:border-green-800/50 bg-white/50 dark:bg-gray-900/50">
                      <h4 className="font-semibold text-sm mb-2 text-green-700 dark:text-green-300">
                        🔄 Real-time Monitoring
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Live dashboards with real-time alerts for significant changes in DAO metrics and governance activities.
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg border border-dashed border-orange-200 dark:border-orange-800/50 bg-white/50 dark:bg-gray-900/50">
                      <h4 className="font-semibold text-sm mb-2 text-orange-700 dark:text-orange-300">
                        🌐 Cross-Chain Analysis
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Comprehensive multi-chain governance analysis and cross-ecosystem DAO performance comparisons.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-200 to-transparent dark:via-purple-800"></div>
                    <span className="text-xs text-muted-foreground px-3">Stay tuned for updates</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-200 to-transparent dark:via-purple-800"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};