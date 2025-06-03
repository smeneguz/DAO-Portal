// components/charts/TokenDistributionChart.tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

interface TokenDistributionProps {
  data: Record<string, number> | null | undefined;
}

const TokenDistributionChart: React.FC<TokenDistributionProps> = ({ data }) => {
  if (!data) {
    return <div className="flex items-center justify-center h-full">No token distribution data available</div>;
  }

  // Transform the data for the chart
  const chartData = Object.entries(data).map(([range, count]) => ({
    range,
    count,
    displayValue: count.toLocaleString(),
  }));

  // Sort the ranges correctly (they're strings like "0-1", "1-10", etc.)
  chartData.sort((a, b) => {
    const aStart = parseInt(a.range.split('-')[0], 10);
    const bStart = parseInt(b.range.split('-')[0], 10);
    return aStart - bStart;
  });

  // Calculate total holders
  const totalHolders = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="h-full">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-medium">Token Distribution</h3>
        <p className="text-sm text-gray-500">Total Holders: {totalHolders.toLocaleString()}</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="range" 
            label={{ 
              value: 'Token Range', 
              position: 'insideBottom', 
              offset: -10 
            }} 
          />
          <YAxis 
            label={{ 
              value: 'Number of Holders', 
              angle: -90, 
              position: 'insideLeft' 
            }}
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
              return value.toString();
            }}
          />
          <Tooltip
            formatter={(value: number) => [value.toLocaleString(), 'Holders']}
            labelFormatter={(label) => `Token Range: ${label}`}
          />
          <Legend />
          <Bar 
            dataKey="count" 
            name="Holders" 
            fill="#3b82f6"
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>Distribution shows number of holders by token balance ranges</p>
      </div>
    </div>
  );
};

export default TokenDistributionChart;