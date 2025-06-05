import React, { useState, useEffect, useRef } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, 
         ResponsiveContainer, ReferenceLine, Label, ReferenceArea } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { VotingIcon, ExportIcon, InfoIcon, WarningIcon } from '../../../ui/icons';

interface VotingEfficiencyAnalysisProps {
  data: any[];
  mode?: 'single' | 'multi';
  title?: string;
}

interface ProcessedVotingData {
  name: string;
  approvalRate: number;
  duration: number;
  totalProposals: number;
  approvedProposals: number;
  size: number;
  category: 'low' | 'medium' | 'high' | 'outlier';
  color: string;
  chain_id?: string;
}

interface VotingStats {
  n: number;
  approval: {
    mean: number;
    median: number;
    std: number;
    ci: { lower: number; upper: number };
  };
  duration: {
    mean: number;
    median: number;
    std: number;
    ci: { lower: number; upper: number };
  };
  correlation: number;
  categories: {
    low: number;
    medium: number;
    high: number;
    outliers: number;
  };
  efficiencyDistribution: {
    lowEfficiency: number;
    mediumEfficiency: number;
    highEfficiency: number;
    durationOutliers: number;
  };
}

const VotingEfficiencyAnalysis: React.FC<VotingEfficiencyAnalysisProps> = ({ 
  data, 
  mode = 'multi',
  title = "Voting Efficiency Analysis"
}) => {
  const [processedData, setProcessedData] = useState<ProcessedVotingData[]>([]);
  const [stats, setStats] = useState<VotingStats | null>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleExport = (format: 'png' | 'svg') => {
    const svgElement = containerRef.current?.querySelector('svg');
    if (!svgElement) {
      console.error('SVG element not found');
      return;
    }
    
    if (format === 'png') {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width * 3;
        canvas.height = img.height * 3;
        ctx?.scale(3, 3);
        ctx?.drawImage(img, 0, 0);
        
        const link = document.createElement('a');
        link.download = `voting_efficiency_analysis.png`;
        link.href = canvas.toDataURL();
        link.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    } else if (format === 'svg') {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.download = `voting_efficiency_analysis.svg`;
      link.href = url;
      link.click();
      
      URL.revokeObjectURL(url);
    }
  };

  // Calculate confidence interval
  const calculateCI = (values: number[], mean: number, std: number, n: number) => {
    const z = 1.96; // 95% confidence level
    const se = std / Math.sqrt(n);
    return {
      lower: mean - z * se,
      upper: mean + z * se
    };
  };

  // Calculate correlation coefficient
  const calculateCorrelation = (x: number[], y: number[]): number => {
    const n = x.length;
    if (n !== y.length || n === 0) return 0;

    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = y.reduce((a, b) => a + b, 0) / n;
    
    const numerator = x.reduce((sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean), 0);
    const xSumSq = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);
    const ySumSq = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    
    const denominator = Math.sqrt(xSumSq * ySumSq);
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  // Categorize voting efficiency
  const categorizeEfficiency = (approvalRate: number, duration: number): { category: ProcessedVotingData['category'], color: string } => {
    // Low efficiency: approval rate <30% OR voting duration <2 days
    if (approvalRate < 30 || duration < 2) {
      return { category: 'low', color: '#ef4444' }; // red
    }
    
    // Duration outliers: >14 days
    if (duration > 14) {
      return { category: 'outlier', color: '#8b5cf6' }; // purple
    }
    
    // High efficiency: approval rate >70% AND duration 3-14 days
    if (approvalRate > 70 && duration >= 3 && duration <= 14) {
      return { category: 'high', color: '#10b981' }; // green
    }
    
    // Medium efficiency: everything else within bounds
    return { category: 'medium', color: '#f59e0b' }; // orange
  };

  useEffect(() => {
    if (!data || data.length === 0) return;

    try {
      const processed: ProcessedVotingData[] = [];
      const anomalousData: any[] = [];

      data.forEach(dao => {
        // Handle both database structure and old JSON structure
        const votingEfficiency = dao.voting_efficiency || {};
        
        const approvalRate = votingEfficiency.approval_rate || 0;
        const duration = votingEfficiency.avg_voting_duration_days || 0;
        const totalProposals = votingEfficiency.total_proposals || 0;
        const approvedProposals = votingEfficiency.approved_proposals || 
                                 Math.round(totalProposals * (approvalRate / 100));

        // Validate data
        if (approvalRate >= 0 && approvalRate <= 100 && duration > 0 && totalProposals > 0) {
          const { category, color } = categorizeEfficiency(approvalRate, duration);
          
          processed.push({
            name: dao.name || dao.dao_name || 'Unknown DAO',
            approvalRate: approvalRate,
            duration: duration,
            totalProposals: totalProposals,
            approvedProposals: approvedProposals,
            size: Math.max(3, Math.sqrt(totalProposals) * 2), // Scale factor for visualization
            category: category,
            color: color,
            chain_id: dao.chain_id
          });
        } else {
          // Track anomalies
          anomalousData.push({
            name: dao.name || dao.dao_name,
            approvalRate: approvalRate,
            duration: duration,
            totalProposals: totalProposals,
            reason: approvalRate < 0 || approvalRate > 100 ? 'Invalid approval rate' :
                   duration <= 0 ? 'Invalid duration' : 'No proposal data'
          });
        }
      });

      // Calculate statistics on valid data
      if (processed.length > 0) {
        const approvalRates = processed.map(d => d.approvalRate);
        const durations = processed.map(d => d.duration);

        // Statistical calculations
        const approvalMean = approvalRates.reduce((a, b) => a + b, 0) / approvalRates.length;
        const durationMean = durations.reduce((a, b) => a + b, 0) / durations.length;

        const approvalStd = Math.sqrt(
          approvalRates.reduce((sum, rate) => sum + Math.pow(rate - approvalMean, 2), 0) / 
          (approvalRates.length - 1)
        );
        const durationStd = Math.sqrt(
          durations.reduce((sum, dur) => sum + Math.pow(dur - durationMean, 2), 0) / 
          (durations.length - 1)
        );

        // Medians
        const sortedApproval = [...approvalRates].sort((a, b) => a - b);
        const sortedDuration = [...durations].sort((a, b) => a - b);
        const approvalMedian = sortedApproval[Math.floor(sortedApproval.length / 2)];
        const durationMedian = sortedDuration[Math.floor(sortedDuration.length / 2)];

        // Confidence intervals
        const approvalCI = calculateCI(approvalRates, approvalMean, approvalStd, approvalRates.length);
        const durationCI = calculateCI(durations, durationMean, durationStd, durations.length);

        // Correlation
        const correlation = calculateCorrelation(approvalRates, durations);

        // Category counts
        const categories = {
          low: processed.filter(d => d.category === 'low').length,
          medium: processed.filter(d => d.category === 'medium').length,
          high: processed.filter(d => d.category === 'high').length,
          outliers: processed.filter(d => d.category === 'outlier').length
        };

        const efficiencyDistribution = {
          lowEfficiency: categories.low,
          mediumEfficiency: categories.medium,
          highEfficiency: categories.high,
          durationOutliers: categories.outliers
        };

        const calculateStats: VotingStats = {
          n: processed.length,
          approval: {
            mean: approvalMean,
            median: approvalMedian,
            std: approvalStd,
            ci: approvalCI
          },
          duration: {
            mean: durationMean,
            median: durationMedian,
            std: durationStd,
            ci: durationCI
          },
          correlation,
          categories,
          efficiencyDistribution
        };
        
        setStats(calculateStats);
      }
      
      setProcessedData(processed);
      setAnomalies(anomalousData);

      // Log anomalies if found
      if (anomalousData.length > 0) {
        console.warn('Found anomalous voting efficiency data:', anomalousData);
      }
    } catch (error) {
      console.error('Error processing voting efficiency data:', error);
    }
  }, [data]);

  if (!processedData.length || !stats) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <VotingIcon className="text-muted-foreground mb-4" size="lg" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Voting Efficiency Data Available</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Voting efficiency analysis requires proposal approval rates and voting duration data.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const correlationStrength = Math.abs(stats.correlation) < 0.3 ? 'weak' : 
                             Math.abs(stats.correlation) < 0.7 ? 'moderate' : 'strong';

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center">
              <VotingIcon className="text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">{title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Analysis of proposal approval rates and voting durations (N = {stats.n})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExport('svg')}
              className="text-xs"
            >
              <ExportIcon size="xs" className="mr-1" />
              SVG
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExport('png')}
              className="text-xs"
            >
              <ExportIcon size="xs" className="mr-1" />
              PNG
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Statistical Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/30">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.approval.mean.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Mean Approval</div>
              <div className="text-xs text-muted-foreground">
                CI: [{stats.approval.ci.lower.toFixed(1)}, {stats.approval.ci.upper.toFixed(1)}]
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.duration.mean.toFixed(1)}d
              </div>
              <div className="text-xs text-muted-foreground">Mean Duration</div>
              <div className="text-xs text-muted-foreground">
                CI: [{stats.duration.ci.lower.toFixed(1)}, {stats.duration.ci.upper.toFixed(1)}]
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.correlation.toFixed(3)}
              </div>
              <div className="text-xs text-muted-foreground">Correlation (r)</div>
              <div className="text-xs text-muted-foreground capitalize">
                {correlationStrength} relationship
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {((stats.efficiencyDistribution.highEfficiency / stats.n) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">High Efficiency</div>
              <div className="text-xs text-muted-foreground">
                {stats.efficiencyDistribution.highEfficiency} DAOs
              </div>
            </div>
          </div>

          {/* Anomaly Warning */}
          {anomalies.length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <WarningIcon className="text-amber-600 mt-1" size="sm" />
              <div>
                <h4 className="font-semibold text-amber-800 dark:text-amber-200">Data Quality Notice</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Found {anomalies.length} DAO(s) with invalid voting efficiency data. 
                  These have been excluded from the analysis.
                </p>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="w-full h-96" ref={containerRef}>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 20, right: 60, bottom: 80, left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                
                {/* Category zones */}
                <ReferenceArea
                  x1={3} x2={14}
                  y1={70} y2={100}
                  fill="#10b981"
                  fillOpacity={0.1}
                  stroke="none"
                />
                <ReferenceArea
                  x1={3} x2={14}
                  y1={30} y2={70}
                  fill="#f59e0b"
                  fillOpacity={0.1}
                  stroke="none"
                />

                <XAxis
                  type="number"
                  dataKey="duration"
                  domain={[0, 'auto']}
                  tickFormatter={(value) => `${value}d`}
                >
                  <Label
                    value="Average Voting Duration (days)"
                    position="bottom"
                    offset={-5}
                    style={{ textAnchor: 'middle', fontSize: '12px', fill: '#666' }}
                  />
                </XAxis>
                <YAxis
                  type="number"
                  dataKey="approvalRate"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                >
                  <Label
                    value="Proposal Approval Rate (%)"
                    angle={-90}
                    position="insideLeft"
                    style={{ textAnchor: 'middle', fontSize: '12px', fill: '#666' }}
                  />
                </YAxis>

                {/* Threshold lines */}
                <ReferenceLine
                  y={30}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{
                    value: "Low Threshold (30%)",
                    position: "right",
                    style: { fontSize: '11px', fill: '#ef4444' }
                  }}
                />
                <ReferenceLine
                  y={70}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  label={{
                    value: "High Threshold (70%)",
                    position: "right",
                    style: { fontSize: '11px', fill: '#10b981' }
                  }}
                />
                <ReferenceLine
                  x={3}
                  stroke="#666"
                  strokeDasharray="3 3"
                  label={{
                    value: "Min Duration (3d)",
                    position: "top",
                    style: { fontSize: '11px', fill: '#666' }
                  }}
                />
                <ReferenceLine
                  x={14}
                  stroke="#666"
                  strokeDasharray="3 3"
                  label={{
                    value: "Max Duration (14d)",
                    position: "top",
                    style: { fontSize: '11px', fill: '#666' }
                  }}
                />

                {/* Mean lines */}
                <ReferenceLine
                  y={stats.approval.mean}
                  stroke="#666"
                  strokeDasharray="2 2"
                  label={{
                    value: `μ = ${stats.approval.mean.toFixed(1)}%`,
                    position: "left",
                    style: { fontSize: '10px', fill: '#666' }
                  }}
                />
                <ReferenceLine
                  x={stats.duration.mean}
                  stroke="#666"
                  strokeDasharray="2 2"
                  label={{
                    value: `μ = ${stats.duration.mean.toFixed(1)}d`,
                    position: "top",
                    style: { fontSize: '10px', fill: '#666' }
                  }}
                />

                <Scatter
                  data={processedData}
                  fill="hsl(var(--primary))"
                  fillOpacity={0.7}
                />

                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold text-foreground mb-2">{data.name}</p>
                          <div className="space-y-1 text-sm">
                            <p className="text-muted-foreground">
                              <span className="font-medium">Approval Rate:</span> {data.approvalRate.toFixed(1)}%
                            </p>
                            <p className="text-muted-foreground">
                              <span className="font-medium">Avg Duration:</span> {data.duration.toFixed(1)} days
                            </p>
                            <p className="text-muted-foreground">
                              <span className="font-medium">Total Proposals:</span> {data.totalProposals}
                            </p>
                            <p className="text-muted-foreground">
                              <span className="font-medium">Approved:</span> {data.approvedProposals}
                            </p>
                            <p className="text-muted-foreground">
                              <span className="font-medium">Category:</span> 
                              <span className={`ml-1 capitalize ${
                                data.category === 'high' ? 'text-green-600' :
                                data.category === 'medium' ? 'text-orange-600' :
                                data.category === 'low' ? 'text-red-600' : 'text-purple-600'
                              }`}>
                                {data.category} efficiency
                              </span>
                            </p>
                            {data.chain_id && (
                              <p className="text-muted-foreground">
                                <span className="font-medium">Chain:</span> {data.chain_id}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Efficiency Classification */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <InfoIcon size="sm" className="text-primary" />
              <h4 className="font-semibold text-foreground">Efficiency Classification</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                <div className="text-2xl font-bold text-red-600">
                  {((stats.efficiencyDistribution.lowEfficiency / stats.n) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Low Efficiency</div>
                <div className="text-xs text-muted-foreground">
                  {stats.efficiencyDistribution.lowEfficiency} DAOs
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <div className="text-2xl font-bold text-yellow-600">
                  {((stats.efficiencyDistribution.mediumEfficiency / stats.n) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Medium Efficiency</div>
                <div className="text-xs text-muted-foreground">
                  {stats.efficiencyDistribution.mediumEfficiency} DAOs
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="text-2xl font-bold text-green-600">
                  {((stats.efficiencyDistribution.highEfficiency / stats.n) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">High Efficiency</div>
                <div className="text-xs text-muted-foreground">
                  {stats.efficiencyDistribution.highEfficiency} DAOs
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                <div className="text-2xl font-bold text-purple-600">
                  {((stats.efficiencyDistribution.durationOutliers / stats.n) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Duration Outliers</div>
                <div className="text-xs text-muted-foreground">
                  {stats.efficiencyDistribution.durationOutliers} DAOs
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Notes */}
          <div className="space-y-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <InfoIcon size="sm" />
              Efficiency Analysis
            </h4>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
              <p>
                • <strong>High Efficiency (Green Zone):</strong> Approval rate &gt;70% AND duration 3-14 days
              </p>
              <p>
                • <strong>Low Efficiency:</strong> Approval rate &lt;30% OR voting duration &lt;3 days
              </p>
              <p>
                • <strong>Duration Outliers:</strong> Voting periods exceeding 14 days may indicate inefficient processes
              </p>
              <p>
                • <strong>Correlation Analysis:</strong> r = {stats.correlation.toFixed(3)} indicates a {correlationStrength} {stats.correlation >= 0 ? 'positive' : 'negative'} relationship between approval rates and voting duration
              </p>
              {stats.correlation < -0.3 && (
                <p>
                  • <strong>Insight:</strong> Longer voting periods tend to correlate with lower approval rates, suggesting potential decision fatigue or stakeholder disengagement
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VotingEfficiencyAnalysis;
