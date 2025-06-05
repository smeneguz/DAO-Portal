import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
         ResponsiveContainer, ReferenceLine, Label, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { AnalyticsIcon, ExportIcon, InfoIcon, WarningIcon } from '../../../ui/icons';

interface ThresholdAnalysisProps {
  data: any[];
  mode?: 'single' | 'multi';
  title?: string;
}

const ThresholdAnalysis: React.FC<ThresholdAnalysisProps> = ({ 
  data, 
  mode = 'multi',
  title = "Governance Threshold Analysis"
}) => {
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [thresholdStats, setThresholdStats] = useState<any>(null);
  const [distributionData, setDistributionData] = useState<any[]>([]);
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
        link.download = `threshold_analysis.png`;
        link.href = canvas.toDataURL();
        link.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    } else if (format === 'svg') {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.download = `threshold_analysis.svg`;
      link.href = url;
      link.click();
      
      URL.revokeObjectURL(url);
    }
  };

  useEffect(() => {
    if (!data || data.length === 0) return;

    try {
      const processed: any[] = [];
      const thresholdBuckets = {
        veryLow: 0,    // < 5%
        low: 0,        // 5-15%
        medium: 0,     // 15-30%
        high: 0,       // 30-50%
        veryHigh: 0    // > 50%
      };

      data.forEach(dao => {
        // Handle both database structure and old JSON structure
        const totalMembers = dao.total_members || 
                           dao.network_participation?.total_members || 
                           0;
        
        const distinctVoters = dao.num_distinct_voters || 
                             dao.network_participation?.num_distinct_voters || 
                             0;

        const healthScore = dao.health_score || 0;
        const treasuryValue = dao.treasury_value || 0;
        
        if (totalMembers > 0) {
          const participationRate = (distinctVoters / totalMembers) * 100;
          
          // Only process valid participation rates
          if (participationRate <= 100 && participationRate >= 0) {
            // Categorize by thresholds
            let category = 'veryLow';
            let color = '#ef4444'; // red
            
            if (participationRate >= 50) {
              category = 'veryHigh';
              color = '#10b981'; // green
              thresholdBuckets.veryHigh++;
            } else if (participationRate >= 30) {
              category = 'high';
              color = '#22c55e'; // light green
              thresholdBuckets.high++;
            } else if (participationRate >= 15) {
              category = 'medium';
              color = '#f59e0b'; // yellow
              thresholdBuckets.medium++;
            } else if (participationRate >= 5) {
              category = 'low';
              color = '#f97316'; // orange
              thresholdBuckets.low++;
            } else {
              thresholdBuckets.veryLow++;
            }

            processed.push({
              name: dao.name || dao.dao_name,
              participationRate: participationRate,
              healthScore: healthScore,
              treasuryValue: treasuryValue,
              totalMembers: totalMembers,
              distinctVoters: distinctVoters,
              category: category,
              color: color,
              chain_id: dao.chain_id
            });
          }
        }
      });

      // Create distribution data for bar chart
      const distributionChartData = [
        { 
          name: 'Very Low\n(<5%)', 
          count: thresholdBuckets.veryLow, 
          percentage: (thresholdBuckets.veryLow / processed.length * 100),
          fill: '#ef4444'
        },
        { 
          name: 'Low\n(5-15%)', 
          count: thresholdBuckets.low, 
          percentage: (thresholdBuckets.low / processed.length * 100),
          fill: '#f97316'
        },
        { 
          name: 'Medium\n(15-30%)', 
          count: thresholdBuckets.medium, 
          percentage: (thresholdBuckets.medium / processed.length * 100),
          fill: '#f59e0b'
        },
        { 
          name: 'High\n(30-50%)', 
          count: thresholdBuckets.high, 
          percentage: (thresholdBuckets.high / processed.length * 100),
          fill: '#22c55e'
        },
        { 
          name: 'Very High\n(>50%)', 
          count: thresholdBuckets.veryHigh, 
          percentage: (thresholdBuckets.veryHigh / processed.length * 100),
          fill: '#10b981'
        }
      ];

      // Calculate statistics
      if (processed.length > 0) {
        const rates = processed.map(d => d.participationRate);
        const healthScores = processed.filter(d => d.healthScore > 0).map(d => d.healthScore);
        
        const calculateStats = {
          totalDAOs: processed.length,
          meanParticipation: rates.reduce((a, b) => a + b, 0) / rates.length,
          meanHealth: healthScores.length > 0 ? healthScores.reduce((a, b) => a + b, 0) / healthScores.length : 0,
          distribution: thresholdBuckets,
          recommendations: {
            needsImprovement: thresholdBuckets.veryLow + thresholdBuckets.low,
            performing: thresholdBuckets.medium + thresholdBuckets.high + thresholdBuckets.veryHigh,
            highPerformers: thresholdBuckets.veryHigh
          }
        };
        
        setThresholdStats(calculateStats);
      }
      
      setProcessedData(processed);
      setDistributionData(distributionChartData);

    } catch (error) {
      console.error('Error processing threshold data:', error);
    }
  }, [data]);

  if (!processedData.length || !thresholdStats) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AnalyticsIcon className="text-muted-foreground mb-4" size="lg" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Threshold Data Available</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Threshold analysis requires valid participation rate data.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
              <AnalyticsIcon className="text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">{title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Analysis of participation thresholds and distribution patterns (N = {thresholdStats.totalDAOs})
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
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/30">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {thresholdStats.meanParticipation.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Avg Participation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {thresholdStats.recommendations.performing}
              </div>
              <div className="text-xs text-muted-foreground">Above Threshold</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {thresholdStats.recommendations.highPerformers}
              </div>
              <div className="text-xs text-muted-foreground">High Performers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {thresholdStats.meanHealth > 0 ? thresholdStats.meanHealth.toFixed(1) : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">Avg Health Score</div>
            </div>
          </div>

          {/* Performance Assessment */}
          {thresholdStats.recommendations.needsImprovement > thresholdStats.recommendations.performing && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <WarningIcon className="text-amber-600 mt-1" size="sm" />
              <div>
                <h4 className="font-semibold text-amber-800 dark:text-amber-200">Performance Alert</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {thresholdStats.recommendations.needsImprovement} out of {thresholdStats.totalDAOs} DAOs 
                  show participation rates below recommended thresholds (&lt;15%). Consider governance optimization strategies.
                </p>
              </div>
            </div>
          )}

          {/* Distribution Chart */}
          <div className="w-full h-80" ref={containerRef}>
            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <InfoIcon size="sm" className="text-primary" />
              Participation Rate Distribution
            </h4>
            <ResponsiveContainer>
              <BarChart data={distributionData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis 
                  dataKey="name" 
                  interval={0}
                  angle={0}
                  textAnchor="middle"
                  height={60}
                  fontSize={11}
                />
                <YAxis>
                  <Label
                    value="Number of DAOs"
                    angle={-90}
                    position="insideLeft"
                    style={{ textAnchor: 'middle', fontSize: '12px', fill: '#666' }}
                  />
                </YAxis>
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold text-foreground mb-2">{label}</p>
                          <div className="space-y-1 text-sm">
                            <p className="text-muted-foreground">
                              <span className="font-medium">Count:</span> {data.count} DAOs
                            </p>
                            <p className="text-muted-foreground">
                              <span className="font-medium">Percentage:</span> {data.percentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="count" 
                  radius={[4, 4, 0, 0]}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth={1}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Threshold Categories */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <InfoIcon size="sm" className="text-primary" />
              Threshold Categories
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {distributionData.map((category, index) => (
                <div key={index} className="text-center p-3 rounded-lg border" style={{ backgroundColor: `${category.fill}10` }}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.fill }}
                    ></div>
                    <span className="text-xs px-2 py-1 rounded border bg-background text-foreground">
                      {category.name.replace('\n', ' ')}
                    </span>
                  </div>
                  <div className="text-lg font-bold" style={{ color: category.fill }}>
                    {category.count}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {category.percentage.toFixed(1)}% of DAOs
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <InfoIcon size="sm" />
              Analysis Insights
            </h4>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
              <p>
                • <strong>Optimal Range:</strong> DAOs with 15-50% participation typically show sustainable governance patterns
              </p>
              <p>
                • <strong>Critical Threshold:</strong> Below 5% participation may indicate governance centralization risks
              </p>
              <p>
                • <strong>High Performance:</strong> Above 50% participation suggests strong community engagement
              </p>
              {thresholdStats.recommendations.needsImprovement > 0 && (
                <p>
                  • <strong>Action Required:</strong> {thresholdStats.recommendations.needsImprovement} DAOs may benefit from 
                  governance incentive programs or process optimization
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThresholdAnalysis;
