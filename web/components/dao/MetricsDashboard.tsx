'use client';

import { useEffect, useState } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { TokenDistributionChart } from './TokenDistributionChart';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface MetricsDashboardProps {
  daoId: number;
}

export function MetricsDashboard({ daoId }: MetricsDashboardProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`/api/v1/daos/${daoId}/enhanced-metrics`);
        if (!response.ok) {
          throw new Error('Failed to fetch metrics');
        }
        const data = await response.json();
        setMetrics(data);
        setLoading(false);
      } catch (err) {
        setError('Error loading metrics');
        setLoading(false);
        console.error(err);
      }
    };

    fetchMetrics();
  }, [daoId]);

  if (loading) return <div className="p-12 text-center">Loading metrics...</div>;
  if (error) return <div className="p-12 text-center text-destructive">{error}</div>;
  if (!metrics) return <div className="p-12 text-center">No metrics available</div>;

  // Extract data for charts
  const networkParticipation = metrics.metrics.network_participation || {};
  const treasury = metrics.metrics.accumulated_funds || {};
  const voting = metrics.metrics.voting_efficiency || {};
  const decentralisation = metrics.metrics.decentralisation || {};
  const health = metrics.metrics.health_metrics || {};

  // Format voting data for pie chart
  const votingData = [
    { name: 'Approved', value: voting.approved_proposals || 0 },
    { name: 'Failed', value: (voting.total_proposals || 0) - (voting.approved_proposals || 0) }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{metrics.dao_name} Metrics Dashboard</h2>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Participation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkParticipation.participation_rate?.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              {networkParticipation.num_distinct_voters} active voters / {networkParticipation.total_members} members
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Treasury Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${treasury.treasury_value_usd?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {(treasury.circulating_token_percentage || 0).toFixed(2)}% tokens in circulation
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Proposal Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{voting.approval_rate?.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              {voting.approved_proposals} of {voting.total_proposals} proposals
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.network_health_score?.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Overall DAO health rating
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Charts */}
      <Tabs defaultValue="participation">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="participation">Participation</TabsTrigger>
          <TabsTrigger value="treasury">Treasury</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
          <TabsTrigger value="token">Token Distribution</TabsTrigger>
        </TabsList>
        
        <TabsContent value="participation" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Network Participation</CardTitle>
              <CardDescription>
                Active voters vs total members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Active', value: networkParticipation.num_distinct_voters || 0 },
                      { name: 'Total', value: networkParticipation.total_members || 0 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="treasury" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Treasury Information</CardTitle>
              <CardDescription>
                Token supply and circulation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Circulating', value: treasury.circulating_supply || 0 },
                        { name: 'Reserved', value: (treasury.total_supply || 0) - (treasury.circulating_supply || 0) }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {[0, 1].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="governance" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Governance Statistics</CardTitle>
              <CardDescription>
                Proposal outcomes and voting efficiency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={votingData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {votingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="token" className="mt-0">
          <TokenDistributionChart 
            distribution={decentralisation.token_distribution || {}} 
            largestHolderPercent={decentralisation.largest_holder_percent || 0}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}