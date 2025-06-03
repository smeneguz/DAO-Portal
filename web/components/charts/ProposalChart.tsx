// components/charts/ProposalChart.tsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ProposalChartProps {
  data: any;
}

const ProposalChart: React.FC<ProposalChartProps> = ({ data }) => {
  if (!data) return <div>No proposal data available</div>;

  // Calculate approval rate percentage
  const approved = data.approved_proposals || 0;
  const total = data.total_proposals || 1; // Avoid division by zero
  const rejected = total - approved;

  // Format data for chart
  const chartData = [
    { name: 'Approved', value: approved, color: '#4ade80' },
    { name: 'Rejected', value: rejected, color: '#f87171' }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md">
          <h4 className="text-lg font-medium">{total}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Proposals</p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md">
          <h4 className="text-lg font-medium">{(data.approval_rate || 0).toFixed(1)}%</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">Approval Rate</p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md">
          <h4 className="text-lg font-medium">{data.avg_voting_duration_days?.toFixed(1) || "N/A"}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">Avg. Duration (days)</p>
        </div>
      </div>

      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => value} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export { ProposalChart };