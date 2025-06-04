// components/charts/multi-dao/MultiDAODecentralizationChart.tsx
import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { 
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, 
  ZAxis, CartesianGrid, Tooltip, Legend, ReferenceLine 
} from 'recharts';
import { useMultiDAOMetrics } from '../../../lib/hooks/useMultiDAOMetrics';
import { Button } from '../../../components/ui/button';

interface MultiDAODecentralizationChartProps {
  daoIds: number[];
}

export const MultiDAODecentralizationChart: React.FC<MultiDAODecentralizationChartProps> = ({ daoIds }) => {
  const { data, isLoading, error } = useMultiDAOMetrics(daoIds);
  const chartRef = useRef(null);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Decentralization Analysis</CardTitle>
          <CardDescription>Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Decentralization Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-500">Error loading DAO metrics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Process data for the scatter chart
  const processedData = data.map(dao => {
    const largestHolder = dao.decentralisation?.largest_holder_percent || 0;
    const participation = dao.network_participation?.participation_rate || 0;
    const automated = dao.decentralisation?.on_chain_automation === 'Yes';
    const totalMembers = dao.network_participation?.total_members || 0;
    
    // Determine category and color based on metrics
    let category, color;
    if (largestHolder > 66) {
      category = 'Low';
      color = '#dc2626'; // Red
    } else if (largestHolder > 33) {
      category = 'Medium-Low';
      color = '#f97316'; // Orange
    } else if (largestHolder > 10) {
      if (participation >= 10 && automated) {
        category = 'Medium-High';
        color = '#22c55e'; // Green
      } else {
        category = 'Medium';
        color = '#84cc16'; // Light Green
      }
    } else {
      category = 'High';
      color = '#15803d'; // Dark Green
    }
    
    return {
      name: dao.dao_name,
      x: largestHolder,
      y: participation,
      z: Math.max(4, Math.log10(totalMembers || 100) * 3), // Size based on members
      category,
      color,
      automated,
      totalMembers
    };
  });

  // Group processed data by category
  const groupedData = Object.entries(
    processedData.reduce((acc, item) => {
      acc[item.category] = acc[item.category] || [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof processedData>)
  );

  // Handle chart export
  const handleExport = (format: 'svg' | 'png') => {
    if (!chartRef.current) return;
    
    const svgElement = chartRef.current.querySelector('svg');
    if (!svgElement) return;
    
    if (format === 'svg') {
      // Convert SVG to string
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      // Create link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'decentralization-analysis.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'png') {
      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const rect = svgElement.getBoundingClientRect();
      
      // Set dimensions (3x for high resolution)
      canvas.width = rect.width * 3;
      canvas.height = rect.height * 3;
      
      if (!ctx) return;
      ctx.scale(3, 3);
      
      // Create image from SVG
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        
        // Convert to PNG and download
        const link = document.createElement('a');
        link.download = 'decentralization-analysis.png';
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      
      // Load SVG as image
      const svgData = new XMLSerializer().serializeToString(svgElement);
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">Decentralization Analysis</CardTitle>
            <CardDescription>
              Comparing largest holder percentage vs. participation rate across DAOs
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('svg')}>
              Export SVG
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('png')}>
              Export PNG
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96" ref={chartRef}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 30, bottom: 60, left: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Largest Holder Percentage" 
                domain={[0, 100]}
                label={{ 
                  value: 'Largest Holder Percentage (%)', 
                  position: 'bottom', 
                  offset: 40 
                }}
                unit="%"
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Participation Rate" 
                domain={[0, 'dataMax']}
                label={{ 
                  value: 'Participation Rate (%)', 
                  angle: -90, 
                  position: 'left', 
                  offset: 0 
                }}
                unit="%"
              />
              <ZAxis 
                type="number" 
                dataKey="z" 
                range={[4, 20]} 
                name="Total Members"
              />
              
              {/* Reference Lines for Thresholds */}
              <ReferenceLine 
                x={66} 
                stroke="#dc2626" 
                strokeDasharray="3 3" 
                label={{ 
                  value: "Low Threshold (66%)", 
                  position: "top",
                  fill: "#dc2626",
                  fontSize: 12
                }} 
              />
              <ReferenceLine 
                x={33} 
                stroke="#f97316" 
                strokeDasharray="3 3" 
                label={{ 
                  value: "Medium Threshold (33%)", 
                  position: "top",
                  fill: "#f97316",
                  fontSize: 12
                }} 
              />
              <ReferenceLine 
                x={10} 
                stroke="#22c55e" 
                strokeDasharray="3 3" 
                label={{ 
                  value: "High Threshold (10%)", 
                  position: "top",
                  fill: "#22c55e",
                  fontSize: 12
                }} 
              />
              <ReferenceLine 
                y={10} 
                stroke="#6b7280" 
                strokeDasharray="3 3"
                label={{ 
                  value: "Min Participation (10%)", 
                  position: "right",
                  fill: "#6b7280",
                  fontSize: 12
                }} 
              />

              {/* Data Points */}
              {groupedData.map(([category, items]) => (
                <Scatter
                  key={category}
                  name={`${category} Decentralization`}
                  data={items}
                  fill={items[0]?.color || '#000'}
                  shape="square"
                />
              ))}

              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded shadow-md dark:bg-gray-800 dark:border-gray-700">
                        <p className="font-bold">{data.name}</p>
                        <p>Decentralization: <span style={{ color: data.color }}>{data.category}</span></p>
                        <p>Largest Holder: {data.x.toFixed(1)}%</p>
                        <p>Participation: {data.y.toFixed(1)}%</p>
                        <p>On-chain Automation: {data.automated ? 'Yes' : 'No'}</p>
                        <p>Total Members: {data.totalMembers?.toLocaleString() || 'N/A'}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={36} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <h4 className="font-medium">Decentralization Categories:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><span className="inline-block w-3 h-3 bg-red-600 mr-2"></span> <strong>Low:</strong> Largest holder over 66%</li>
            <li><span className="inline-block w-3 h-3 bg-orange-500 mr-2"></span> <strong>Medium-Low:</strong> Largest holder between 33-66%</li>
            <li><span className="inline-block w-3 h-3 bg-lime-500 mr-2"></span> <strong>Medium:</strong> Largest holder between 10-33%, low participation or no automation</li>
            <li><span className="inline-block w-3 h-3 bg-green-500 mr-2"></span> <strong>Medium-High:</strong> Largest holder between 10-33%, {'>'}10% participation, with automation</li>
            <li><span className="inline-block w-3 h-3 bg-green-800 mr-2"></span> <strong>High:</strong> Largest holder under 10%</li>
          </ul>
          <p className="italic">
            Note: Point size indicates relative number of total members in the DAO.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};