"use client"

// components/charts/multi-dao/MultiDAOComparisonChart.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { useMultiDAOMetrics } from '../../../lib/hooks/useMultiDAOMetrics';

interface MultiDAOComparisonChartProps {
  daoIds: number[];
}

export const MultiDAOComparisonChart: React.FC<MultiDAOComparisonChartProps> = ({ daoIds }) => {
  const { data, isLoading, error } = useMultiDAOMetrics(daoIds);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">DAO Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
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
          <CardTitle className="text-xl">DAO Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-500">Error loading DAO metrics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Simple comparison table instead of chart
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">DAO Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">DAO Name</th>
                <th className="text-right p-2">Participation</th>
                <th className="text-right p-2">Members</th>
                <th className="text-right p-2">Treasury</th>
                <th className="text-right p-2">Health Score</th>
              </tr>
            </thead>
            <tbody>
              {data.map((dao) => (
                <tr key={dao.id} className="border-b">
                  <td className="p-2 font-medium">{dao.dao_name || dao.name || 'Unknown DAO'}</td>
                  <td className="text-right p-2">
                    {dao.network_participation?.participation_rate !== null && 
                     dao.network_participation?.participation_rate !== undefined 
                      ? `${parseFloat(dao.network_participation.participation_rate).toFixed(2)}%` 
                      : 'N/A'}
                  </td>
                  <td className="text-right p-2">
                    {dao.network_participation?.total_members !== null && 
                     dao.network_participation?.total_members !== undefined
                      ? parseInt(dao.network_participation.total_members).toLocaleString() 
                      : 'N/A'}
                  </td>
                  <td className="text-right p-2">
                    {dao.accumulated_funds?.treasury_value_usd !== null && 
                     dao.accumulated_funds?.treasury_value_usd !== undefined
                      ? `$${dao.accumulated_funds.treasury_value_usd.toLocaleString(undefined, {
                          maximumFractionDigits: 0
                        })}`
                      : 'N/A'}
                  </td>
                  <td className="text-right p-2">
                    {dao.health_metrics?.network_health_score !== null && 
                     dao.health_metrics?.network_health_score !== undefined
                      ? dao.health_metrics.network_health_score.toFixed(2)
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-8 text-center text-gray-500">
          <p>A more interactive chart visualization will be implemented in the future.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiDAOComparisonChart;