import React, { useState, useEffect, useRef } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, 
         ResponsiveContainer, ReferenceLine, Label } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { TreasuryIcon, ExportIcon, InfoIcon } from '../../../ui/icons';

interface TreasuryAnalysisProps {
  data: any[];
  mode?: 'single' | 'multi';
  title?: string;
}

const TreasuryAnalysis: React.FC<TreasuryAnalysisProps> = ({ 
  data, 
  mode = 'multi',
  title = "Treasury and Token Distribution Analysis"
}) => {
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleExport = (format: 'png' | 'svg') => {
    const svgElement = containerRef.current?.querySelector('svg');
    if (!svgElement) {
      console.error('SVG element not found');
      return;
    }
    
    if (format === 'png') {
      // Create canvas for PNG export
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width * 3; // 3x resolution
        canvas.height = img.height * 3;
        ctx?.scale(3, 3);
        ctx?.drawImage(img, 0, 0);
        
        const link = document.createElement('a');
        link.download = `treasury_analysis.png`;
        link.href = canvas.toDataURL();
        link.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    } else if (format === 'svg') {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.download = `treasury_analysis.svg`;
      link.href = url;
      link.click();
      
      URL.revokeObjectURL(url);
    }
  };

  useEffect(() => {
    if (!data || data.length === 0) return;

    try {
      // Process data for visualization
      const processed = data
        .map(dao => {
          // Handle both database structure and old JSON structure
          const treasuryValue = dao.treasury_value_usd || dao.accumulated_funds?.treasury_value_usd || 0;
          const circulatingPercentage = dao.circulating_token_percentage || 
                                       dao.accumulated_funds?.circulating_token_percentage || 
                                       (dao.accumulated_funds?.circulating_supply / dao.accumulated_funds?.total_supply * 100) || 0;
          
          if (treasuryValue <= 0 || circulatingPercentage <= 0) return null;

          return {
            name: dao.name || dao.dao_name,
            x: Math.log10(Math.max(1, treasuryValue)),
            y: circulatingPercentage,
            raw: {
              treasury: treasuryValue,
              circulating: circulatingPercentage,
              total_supply: dao.total_supply || dao.accumulated_funds?.total_supply || 0,
              velocity: dao.token_velocity || dao.accumulated_funds?.token_velocity || 0,
              members: dao.total_members || 0,
              chain_id: dao.chain_id
            }
          };
        })
        .filter(item => item !== null && !isNaN(item.x) && !isNaN(item.y));

      // Calculate statistics
      const treasuryValues = processed.map(d => d.raw.treasury);
      const circulatingValues = processed.map(d => d.raw.circulating);
      
      const calculateStats = {
        n: processed.length,
        treasury: {
          mean: treasuryValues.reduce((a, b) => a + b, 0) / processed.length,
          median: [...treasuryValues].sort((a, b) => a - b)[Math.floor(processed.length/2)],
          low: treasuryValues.filter(v => v < 100_000_000).length,
          medium: treasuryValues.filter(v => v >= 100_000_000 && v <= 1_000_000_000).length,
          high: treasuryValues.filter(v => v > 1_000_000_000).length
        },
        circulation: {
          mean: circulatingValues.reduce((a, b) => a + b, 0) / processed.length,
          low_circ: processed.filter(d => 
            d.raw.treasury >= 100_000_000 && 
            d.raw.treasury <= 1_000_000_000 && 
            d.raw.circulating < 50
          ).length,
          high_circ: processed.filter(d => 
            d.raw.treasury >= 100_000_000 && 
            d.raw.treasury <= 1_000_000_000 && 
            d.raw.circulating >= 50
          ).length
        }
      };
      
      setStats(calculateStats);
      setProcessedData(processed);
    } catch (error) {
      console.error('Error processing treasury data:', error);
    }
  }, [data]);

  if (!processedData.length || !stats) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TreasuryIcon className="text-muted-foreground mb-4" size="lg" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Treasury Data Available</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Treasury analysis requires valid treasury values and token distribution data.
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
              <TreasuryIcon className="text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">{title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Relationship between treasury value and circulating token percentage (N = {stats.n})
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
          {/* Treasury Categories Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {((stats.treasury.low/stats.n)*100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Low Treasury (&lt;$100M)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {((stats.treasury.medium/stats.n)*100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Medium Treasury ($100M-$1B)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {((stats.treasury.high/stats.n)*100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">High Treasury (&gt;$1B)</div>
            </div>
          </div>

          {/* Chart */}
          <div className="w-full h-96" ref={containerRef}>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 20, right: 60, bottom: 60, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={[0, 'auto']}
                  tickFormatter={(value) => `$${Math.pow(10, value).toExponential(0)}`}
                >
                  <Label
                    value="Treasury Value (USD, log₁₀ scale)"
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
                    value="Circulating Token Percentage"
                    angle={-90}
                    position="insideLeft"
                    style={{ textAnchor: 'middle', fontSize: '12px', fill: '#666' }}
                  />
                </YAxis>

                {/* Reference Lines */}
                <ReferenceLine
                  x={Math.log10(100_000_000)}
                  stroke="#666"
                  strokeDasharray="3 3"
                  label={{
                    value: "$100M",
                    position: "top",
                    style: { fontSize: '11px', fill: '#666' }
                  }}
                />
                <ReferenceLine
                  x={Math.log10(1_000_000_000)}
                  stroke="#666"
                  strokeDasharray="3 3"
                  label={{
                    value: "$1B",
                    position: "top",
                    style: { fontSize: '11px', fill: '#666' }
                  }}
                />
                <ReferenceLine
                  y={50}
                  stroke="#666"
                  strokeDasharray="3 3"
                  label={{
                    value: "50% Circulation",
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
                              <span className="font-medium">Treasury:</span> ${data.raw.treasury.toLocaleString()}
                            </p>
                            <p className="text-muted-foreground">
                              <span className="font-medium">Circulating:</span> {data.raw.circulating.toFixed(2)}%
                            </p>
                            {data.raw.total_supply > 0 && (
                              <p className="text-muted-foreground">
                                <span className="font-medium">Total Supply:</span> {data.raw.total_supply.toLocaleString()}
                              </p>
                            )}
                            {data.raw.velocity > 0 && (
                              <p className="text-muted-foreground">
                                <span className="font-medium">Token Velocity:</span> {data.raw.velocity.toFixed(4)}
                              </p>
                            )}
                            {data.raw.members > 0 && (
                              <p className="text-muted-foreground">
                                <span className="font-medium">Members:</span> {data.raw.members.toLocaleString()}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h5 className="font-medium text-foreground">Treasury Distribution:</h5>
                <ul className="space-y-1 text-muted-foreground ml-4">
                  <li>• Low Treasury (&lt;$100M): {((stats.treasury.low/stats.n)*100).toFixed(1)}% of DAOs</li>
                  <li>• Medium Treasury ($100M-$1B): {((stats.treasury.medium/stats.n)*100).toFixed(1)}% of DAOs</li>
                  <li>• High Treasury (&gt;$1B): {((stats.treasury.high/stats.n)*100).toFixed(1)}% of DAOs</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h5 className="font-medium text-foreground">Medium Treasury Circulation:</h5>
                <ul className="space-y-1 text-muted-foreground ml-4">
                  <li>• Low Circulation (&lt;50%): {((stats.circulation.low_circ/stats.n)*100).toFixed(1)}% of total</li>
                  <li>• High Circulation (≥50%): {((stats.circulation.high_circ/stats.n)*100).toFixed(1)}% of total</li>
                </ul>
              </div>
            </div>
            <div className="text-xs text-muted-foreground italic pt-2 border-t border-border/50">
              Note: Treasury values are shown on logarithmic scale. Reference lines indicate category thresholds.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TreasuryAnalysis;
