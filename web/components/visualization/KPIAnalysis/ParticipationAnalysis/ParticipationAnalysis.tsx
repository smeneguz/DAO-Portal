import React, { useState, useEffect, useRef } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, 
         ResponsiveContainer, ReferenceLine, Label } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { ParticipationIcon, ExportIcon, InfoIcon, WarningIcon } from '../../../ui/icons';

interface ParticipationAnalysisProps {
  data: any[];
  mode?: 'single' | 'multi';
  title?: string;
}

const ParticipationAnalysis: React.FC<ParticipationAnalysisProps> = ({ 
  data, 
  mode = 'multi',
  title = "Network Participation Distribution Analysis"
}) => {
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
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
        link.download = `participation_analysis.png`;
        link.href = canvas.toDataURL();
        link.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    } else if (format === 'svg') {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.download = `participation_analysis.svg`;
      link.href = url;
      link.click();
      
      URL.revokeObjectURL(url);
    }
  };

  useEffect(() => {
    if (!data || data.length === 0) return;

    try {
      const processed: any[] = [];
      const anomalousData: any[] = [];

      data.forEach(dao => {
        // Handle both database structure and old JSON structure
        const totalMembers = dao.total_members || 
                           dao.network_participation?.total_members || 
                           0;
        
        const distinctVoters = dao.num_distinct_voters || 
                             dao.network_participation?.num_distinct_voters || 
                             0;
        
        const uniqueProposers = dao.unique_proposers || 
                              dao.network_participation?.unique_proposers || 
                              0;

        if (totalMembers > 0) {
          const calculatedRate = (distinctVoters / totalMembers) * 100;
          
          if (calculatedRate <= 100 && calculatedRate >= 0) {
            processed.push({
              name: dao.name || dao.dao_name,
              x: Math.log10(Math.max(1, totalMembers)),
              y: calculatedRate,
              raw: {
                members: totalMembers,
                voters: distinctVoters,
                unique_proposers: uniqueProposers,
                calculatedRate: calculatedRate,
                storedRate: dao.participation_rate || 0,
                chain_id: dao.chain_id
              }
            });
          } else {
            // Track anomalies
            anomalousData.push({
              name: dao.name || dao.dao_name,
              voters: distinctVoters,
              members: totalMembers,
              calculatedRate: calculatedRate
            });
          }
        }
      });

      // Calculate statistics on valid data
      if (processed.length > 0) {
        const rates = processed.map(d => d.y);
        const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
        const sortedRates = [...rates].sort((a, b) => a - b);
        const variance = rates.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (rates.length - 1);
        
        const calculateStats = {
          n: rates.length,
          mean,
          median: sortedRates[Math.floor(rates.length/2)],
          std: Math.sqrt(variance),
          distribution: {
            low: rates.filter(r => r < 10).length,
            medium: rates.filter(r => r >= 10 && r <= 40).length,
            high: rates.filter(r => r > 40).length
          },
          quartiles: {
            q1: sortedRates[Math.floor(rates.length * 0.25)],
            q3: sortedRates[Math.floor(rates.length * 0.75)]
          }
        };
        
        setStats(calculateStats);
      }
      
      setProcessedData(processed);
      setAnomalies(anomalousData);

      // Log anomalies if found
      if (anomalousData.length > 0) {
        console.warn('Found anomalous participation rates:', anomalousData);
      }
    } catch (error) {
      console.error('Error processing participation data:', error);
    }
  }, [data]);

  if (!processedData.length || !stats) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ParticipationIcon className="text-muted-foreground mb-4" size="lg" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Participation Data Available</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Participation analysis requires valid member count and voter data.
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
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/10 to-blue-500/10 flex items-center justify-center">
              <ParticipationIcon className="text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">{title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Analysis of participation rates across community sizes (N = {stats.n})
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
                {stats.mean.toFixed(2)}%
              </div>
              <div className="text-xs text-muted-foreground">Mean (μ)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.median.toFixed(2)}%
              </div>
              <div className="text-xs text-muted-foreground">Median</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.std.toFixed(2)}%
              </div>
              <div className="text-xs text-muted-foreground">Std Dev (σ)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                [{stats.quartiles.q1.toFixed(1)}%, {stats.quartiles.q3.toFixed(1)}%]
              </div>
              <div className="text-xs text-muted-foreground">IQR</div>
            </div>
          </div>

          {/* Anomaly Warning */}
          {anomalies.length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <WarningIcon className="text-amber-600 mt-1" size="sm" />
              <div>
                <h4 className="font-semibold text-amber-800 dark:text-amber-200">Data Quality Notice</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Found {anomalies.length} DAO(s) with anomalous participation rates (&gt;100% or &lt;0%). 
                  These have been excluded from the analysis.
                </p>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="w-full h-96" ref={containerRef}>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 20, right: 60, bottom: 60, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => `10^${value.toFixed(0)}`}
                >
                  <Label
                    value="Community Size (log₁₀ scale)"
                    position="bottom"
                    offset={-5}
                    style={{ textAnchor: 'middle', fontSize: '12px', fill: '#666' }}
                  />
                </XAxis>
                <YAxis
                  type="number"
                  dataKey="y"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                >
                  <Label
                    value="Participation Rate (%)"
                    angle={-90}
                    position="insideLeft"
                    style={{ textAnchor: 'middle', fontSize: '12px', fill: '#666' }}
                  />
                </YAxis>

                {/* Reference Lines */}
                <ReferenceLine
                  y={10}
                  stroke="#666"
                  strokeDasharray="3 3"
                  label={{
                    value: "Low Threshold (10%)",
                    position: "right",
                    style: { fontSize: '11px', fill: '#666' }
                  }}
                />
                <ReferenceLine
                  y={40}
                  stroke="#666"
                  strokeDasharray="3 3"
                  label={{
                    value: "High Threshold (40%)",
                    position: "right",
                    style: { fontSize: '11px', fill: '#666' }
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
                              <span className="font-medium">Members:</span> {data.raw.members.toLocaleString()}
                            </p>
                            <p className="text-muted-foreground">
                              <span className="font-medium">Voters:</span> {data.raw.voters.toLocaleString()}
                            </p>
                            <p className="text-muted-foreground">
                              <span className="font-medium">Participation:</span> {data.y.toFixed(2)}%
                            </p>
                            {data.raw.unique_proposers > 0 && (
                              <p className="text-muted-foreground">
                                <span className="font-medium">Proposers:</span> {data.raw.unique_proposers}
                              </p>
                            )}
                            {data.raw.chain_id && (
                              <p className="text-muted-foreground">
                                <span className="font-medium">Chain:</span> {data.raw.chain_id}
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

          {/* Distribution Analysis */}
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-2 mb-3">
              <InfoIcon size="sm" className="text-primary" />
              <h4 className="font-semibold text-foreground">Distribution Analysis</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                <div className="text-2xl font-bold text-red-600">
                  {((stats.distribution.low/stats.n)*100).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Low participation (&lt;10%)</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <div className="text-2xl font-bold text-yellow-600">
                  {((stats.distribution.medium/stats.n)*100).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Medium participation (10-40%)</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="text-2xl font-bold text-green-600">
                  {((stats.distribution.high/stats.n)*100).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">High participation (&gt;40%)</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground italic pt-2 border-t border-border/50">
              Note: The horizontal lines represent theoretical boundaries for participation categories.
              Community size shown on logarithmic scale for better visualization of the full range.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ParticipationAnalysis;
