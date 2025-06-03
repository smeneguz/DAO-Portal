// components/charts/TreasuryChart.tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TreasuryChartProps {
  data: any;
}

const TreasuryChart: React.FC<TreasuryChartProps> = ({ data }) => {
  if (!data) return <div>No treasury data available</div>;

  // Format data for chart
  const chartData = [
    {
      name: 'Treasury Value',
      value: data.treasury_value_usd || 0,
      label: 'Treasury (USD)',
      color: '#38bdf8'
    },
    {
      name: 'Circulating Supply',
      value: data.circulating_supply || 0,
      label: 'Circulating Supply',
      color: '#4ade80'
    },
    {
      name: 'Total Supply',
      value: data.total_supply || 0,
      label: 'Total Supply',
      color: '#a78bfa'
    }
  ];

  // Format tooltip value
  const formatValue = (value: number) => {
    if (value > 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(2)}B`;
    } else if (value > 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M`;
    } else if (value > 1_000) {
      return `${(value / 1_000).toFixed(2)}K`;
    }
    return value.toFixed(2);
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis 
          type="number" 
          tickFormatter={(value) => formatValue(value)}
        />
        <YAxis type="category" dataKey="name" width={120} />
        <Tooltip 
          formatter={(value: number) => formatValue(value)}
          labelFormatter={(name) => chartData.find(item => item.name === name)?.label || name}
        />
        <Bar 
          dataKey="value" 
          fill={(entry) => entry.color}
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export { TreasuryChart };