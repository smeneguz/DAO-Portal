// components/charts/ParticipationChart.tsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface ParticipationChartProps {
  data: any;
}

const ParticipationChart: React.FC<ParticipationChartProps> = ({ data }) => {
  if (!data) {
    return <div className="flex items-center justify-center h-full">No participation data available</div>;
  }

  // Create a more detailed visualization with both rate and absolute numbers
  const chartData = [
    {
      name: 'Current',
      participationRate: data.participation_rate || 0,
      voters: data.num_distinct_voters || 0,
      totalMembers: data.total_members || 0,
    }
  ];

  // Generate some simulated historical data to make the chart more interesting
  // In a real application, you would fetch this from an API
  const simulateHistory = () => {
    const baseParticipation = data.participation_rate || 5;
    const baseVoters = data.num_distinct_voters || 1000;
    const baseMembership = data.total_members || 20000;
    
    // Generate 6 periods back with slight variations
    for (let i = 1; i <= 6; i++) {
      // Create some variation with a general upward trend for visualization
      const variationFactor = Math.random() * 0.2 - 0.1; // Random between -0.1 and 0.1
      const periodMultiplier = 0.85 + (i * 0.03); // Gradual increase going backward
      
      chartData.unshift({
        name: `Period -${i}`,
        participationRate: Math.max(1, baseParticipation * periodMultiplier * (1 + variationFactor)),
        voters: Math.round(baseVoters * periodMultiplier * (1 + variationFactor)),
        totalMembers: Math.round(baseMembership * periodMultiplier),
      });
    }
  };

  simulateHistory();

  return (
    <div className="h-full">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-medium">Participation Metrics</h3>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-center">
            <div className="text-lg font-semibold">{data.participation_rate?.toFixed(2)}%</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Participation Rate</div>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-center">
            <div className="text-lg font-semibold">{data.num_distinct_voters?.toLocaleString()}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Distinct Voters</div>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-center">
            <div className="text-lg font-semibold">{data.total_members?.toLocaleString()}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Total Members</div>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            label={{ 
              value: 'Time Period', 
              position: 'insideBottom', 
              offset: -15 
            }} 
          />
          <YAxis 
            yAxisId="left"
            label={{ 
              value: 'Participation Rate (%)', 
              angle: -90, 
              position: 'insideLeft' 
            }}
            domain={[0, 'dataMax * 1.2']}
            tickFormatter={(value) => `${value.toFixed(1)}%`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{ 
              value: 'Voters', 
              angle: 90, 
              position: 'insideRight' 
            }}
            domain={[0, 'auto']}
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
              return value.toString();
            }}
          />
          <Tooltip 
            formatter={(value, name) => {
              if (name === 'participationRate') return [`${value.toFixed(2)}%`, 'Participation Rate'];
              if (name === 'voters') return [value.toLocaleString(), 'Distinct Voters'];
              if (name === 'totalMembers') return [value.toLocaleString(), 'Total Members'];
              return [value, name];
            }}
          />
          <ReferenceLine 
            y={10} 
            yAxisId="left" 
            stroke="#ff8800" 
            strokeDasharray="3 3" 
            label={{ 
              value: 'Min Target (10%)',
              position: 'top',
              fill: '#ff8800',
              fontSize: 12
            }} 
          />
          <Line 
            type="monotone" 
            dataKey="participationRate" 
            stroke="#3b82f6" 
            strokeWidth={2} 
            dot={{ r: 4 }} 
            yAxisId="left"
            name="Participation Rate"
          />
          <Line 
            type="monotone" 
            dataKey="voters" 
            stroke="#10b981" 
            strokeWidth={2} 
            dot={{ r: 4 }} 
            yAxisId="right"
            name="Distinct Voters"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        <p className="italic">* Historical data is simulated for demonstration</p>
      </div>
    </div>
  );
};

export default ParticipationChart;