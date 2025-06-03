
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, 
         ResponsiveContainer, ReferenceLine, Label, Legend, Rectangle, ReferenceArea } from 'recharts';
import _ from 'lodash';

// Simple export utilities (can be expanded)
const exportToPNG = (ref: any, filename: string, scale: number = 2) => {
  if (!ref.current) return;
  // Implementation for export would go here
  console.log(`Exporting ${filename} as PNG at scale ${scale}`);
};

const exportToSVG = (ref: any, filename: string) => {
  if (!ref.current) return;
  // Implementation for export would go here
  console.log(`Exporting ${filename} as SVG`);
};

// Component accepts data directly
const DecentralizationAnalysisImproved3 = ({ data: inputData = [] }) => {
  const [data, setData] = useState<any[] | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleExport = (format: 'png' | 'svg') => {
    if (format === 'png') {
      exportToPNG(containerRef, 'decentralization_analysis', 3);
    } else if (format === 'svg') {
      exportToSVG(containerRef, 'decentralization_analysis');
    }
  };

  // Enhanced statistical functions
  const calculateStatistics = (data: any[]) => {
    if (!data || data.length === 0) return null;
    
    // Extract metrics
    const largestHolderValues = data.map(d => d.largestHolder);
    const participationValues = data.map(d => d.participation);
    
    // Calculate quantiles for robust statistics
    const sortedHolders = [...largestHolderValues].sort((a, b) => a - b);
    const sortedParticipation = [...participationValues].sort((a, b) => a - b);
    
    const holderMean = _.mean(largestHolderValues);
    const holderMedian = sortedHolders[Math.floor(sortedHolders.length * 0.5)];
    const holderStd = Math.sqrt(_.sumBy(largestHolderValues, x => Math.pow(x - holderMean, 2)) / (largestHolderValues.length - 1));
    const holderQ1 = sortedHolders[Math.floor(sortedHolders.length * 0.25)];
    const holderQ3 = sortedHolders[Math.floor(sortedHolders.length * 0.75)];
    
    const participationMean = _.mean(participationValues);
    const participationMedian = sortedParticipation[Math.floor(sortedParticipation.length * 0.5)];
    const participationStd = Math.sqrt(_.sumBy(participationValues, x => Math.pow(x - participationMean, 2)) / (participationValues.length - 1));
    const participationQ1 = sortedParticipation[Math.floor(participationValues.length * 0.25)];
    const participationQ3 = sortedParticipation[Math.floor(participationValues.length * 0.75)];

    // Calculate correlation
    const correlation = calculateCorrelation(largestHolderValues, participationValues);

    // Paper-defined thresholds for categories
    const categorizeDAO = (dao: any) => {
      if (dao.largestHolder > 66) return 'low';
      if (dao.largestHolder > 33) return 'mediumLow';
      if (dao.largestHolder > 10) {
        if (dao.participation >= 10 && dao.automated) return 'mediumHigh';
        return 'medium';
      }
      return 'high';
    };

    // Count DAOs in each category
    const categoryCount = data.reduce((acc, dao) => {
      const category = categorizeDAO(dao);
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Participation distribution
    const lowParticipation = data.filter(d => d.participation < 10).length;
    const highParticipation = data.filter(d => d.participation > 40).length;
    const mediumParticipation = data.length - lowParticipation - highParticipation;

    return {
      n: data.length,
      largestHolder: {
        mean: holderMean,
        median: holderMedian,
        std: holderStd,
        q1: holderQ1,
        q3: holderQ3
      },
      participation: {
        mean: participationMean,
        median: participationMedian,
        std: participationStd,
        q1: participationQ1,
        q3: participationQ3,
        max: Math.max(...participationValues),
        distribution: {
          low: lowParticipation,
          medium: mediumParticipation,
          high: highParticipation
        }
      },
      correlation,
      automated: data.filter(d => d.automated).length,
      categories: categoryCount,
      percentages: {
        low: (categoryCount.low || 0) / data.length * 100,
        mediumLow: (categoryCount.mediumLow || 0) / data.length * 100,
        medium: (categoryCount.medium || 0) / data.length * 100,
        mediumHigh: (categoryCount.mediumHigh || 0) / data.length * 100,
        high: (categoryCount.high || 0) / data.length * 100
      },
      participationPercentages: {
        low: (lowParticipation / data.length) * 100,
        medium: (mediumParticipation / data.length) * 100,
        high: (highParticipation / data.length) * 100
      }
    };
  };

  // Calculate Pearson correlation coefficient
  const calculateCorrelation = (x: number[], y: number[]) => {
    if (!x || !y || x.length !== y.length || x.length === 0) return 0;
    
    const xMean = _.mean(x);
    const yMean = _.mean(y);
    
    let numerator = 0;
    let xSumSquared = 0;
    let ySumSquared = 0;
    
    for (let i = 0; i < x.length; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = y[i] - yMean;
      numerator += xDiff * yDiff;
      xSumSquared += xDiff * xDiff;
      ySumSquared += yDiff * yDiff;
    }
    
    // Avoid division by zero
    if (xSumSquared === 0 || ySumSquared === 0) return 0;
    
    return numerator / (Math.sqrt(xSumSquared) * Math.sqrt(ySumSquared));
  };

  useEffect(() => {
    const analyzeDecentralization = async () => {
      try {
        let jsonData = inputData;
        
        // If no input data, use sample data or fetch from file
        if (!jsonData || jsonData.length === 0) {
          try {
            const response = await fetch('/dao_data.json');
            jsonData = await response.json();
          } catch (error) {
            console.error("Error fetching sample data:", error);
            setData([]);
            setStats(null);
            return;
          }
        }

        // Process data points with validation
        const processedData = jsonData
          .map((dao: any) => {
            // Check for required data
            if (!dao) {
              console.warn("Found null or undefined DAO in data");
              return null;
            }
            
            // Safely access nested properties with fallbacks
            const decentralisation = dao.decentralisation || {};
            const network_participation = dao.network_participation || {};
            
            // If critical data is missing, log the issue but still create a record
            // with fallback values where possible
            if (!decentralisation || !network_participation) {
              console.warn(`Missing critical data for DAO: ${dao.name || dao.dao_name || 'Unknown'}`);
            }
            
            return {
              name: dao.name || dao.dao_name || 'Unknown DAO',
              largestHolder: decentralisation.largest_holder_percent !== undefined ? 
                decentralisation.largest_holder_percent : null,
              participation: network_participation.participation_rate !== undefined ? 
                network_participation.participation_rate : null,
              automated: decentralisation.on_chain_automation === 'Yes',
              totalHolders: decentralisation.token_distribution ? 
                Object.values(decentralisation.token_distribution).reduce((acc: number, val: number) => acc + val, 0) : 0,
              proposerConcentration: decentralisation.proposer_concentration,
              totalMembers: network_participation.total_members !== undefined ? 
                network_participation.total_members : null
            };
          })
          .filter((d: any) => d !== null)
          .filter((d: any) => {
            // Only include items with valid data for both metrics
            const hasValidLargestHolder = 
              d.largestHolder !== null && 
              d.largestHolder !== undefined && 
              !isNaN(d.largestHolder) && 
              d.largestHolder >= 0 && 
              d.largestHolder <= 100;
              
            const hasValidParticipation = 
              d.participation !== null && 
              d.participation !== undefined && 
              !isNaN(d.participation) && 
              d.participation >= 0;
              
            // Log if we're filtering out a data point
            if (!hasValidLargestHolder || !hasValidParticipation) {
              console.warn(`Filtering out DAO ${d.name} due to invalid data:`, 
                { largestHolder: d.largestHolder, participation: d.participation });
            }
            
            return hasValidLargestHolder && hasValidParticipation;
          });

        // Manage outliers - cap participation at 100% for visualization
        const normalizedData = processedData.map((d: any) => ({
          ...d,
          participation: Math.min(d.participation, 100)
        }));

        // Assign categories and colors per paper definitions
        const categorizedData = normalizedData.map((dao: any) => {
          let category, color, score;
          
          if (dao.largestHolder > 66) {
            category = 'Low';
            color = '#d32f2f'; // Red
            score = 0.6;
          } else if (dao.largestHolder > 33) {
            category = 'Medium-Low';
            color = '#f57c00'; // Orange
            score = 1.2;
          } else if (dao.largestHolder > 10) {
            if (dao.participation >= 10 && dao.automated) {
              category = 'Medium-High';
              color = '#388e3c'; // Green
              score = 2.4;
            } else {
              category = 'Medium';
              color = '#7cb342'; // Light Green
              score = 1.8;
            }
          } else {
            category = 'High';
            color = '#1b5e20'; // Dark Green
            score = 3.0;
          }
          
          return {
            ...dao,
            category,
            color,
            score,
            // Scale point size based on membership with better visibility
            size: Math.max(6, Math.log10(dao.totalMembers || 100) * 3)
          };
        });

        const statistics = calculateStatistics(categorizedData);
        
        setStats(statistics);
        setData(categorizedData);

      } catch (error) {
        console.error('Error processing data:', error);
        setData([]);
        setStats(null);
      }
    };

    analyzeDecentralization();
  }, [inputData]);

  if (!data || !stats) return <div>Loading...</div>;
  
  if (data.length === 0) {
    return <div className="p-4 text-center">No data available for analysis</div>;
  }

  return (
    <div className="w-full p-5">
      <div className="flex justify-end mb-2 space-x-2">
        <button 
          onClick={() => handleExport('svg')}
          className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          Export SVG
        </button>
        <button 
          onClick={() => handleExport('png')}
          className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          Export PNG
        </button>
      </div>

      <div className="text-center mb-5">
        <h2 className="text-lg font-semibold mb-2">
          Multi-dimensional Analysis of DAO Decentralization
        </h2>
        <p className="text-sm text-gray-600">
          Distribution of economic and governance decentralization metrics (N = {stats.n})
        </p>
        <p className="text-sm italic">
          Largest Holder: μ = {stats.largestHolder.mean.toFixed(1)}% 
          (Median: {stats.largestHolder.median.toFixed(1)}%, IQR: {stats.largestHolder.q1.toFixed(1)}-{stats.largestHolder.q3.toFixed(1)}%)
        </p>
        <p className="text-sm italic">
          Participation: μ = {stats.participation.mean.toFixed(1)}% 
          (Median: {stats.participation.median.toFixed(1)}%, IQR: {stats.participation.q1.toFixed(1)}-{stats.participation.q3.toFixed(1)}%)
        </p>
      </div>

      <div className="w-full h-[500px]" ref={containerRef}>
        <ResponsiveContainer>
          <ScatterChart
            margin={{ top: 20, right: 50, bottom: 60, left: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis 
              type="number"
              dataKey="largestHolder"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              name="Largest Holder"
            >
              <Label
                value="Largest Holder Percentage (%)"
                position="bottom"
                offset={40}
                style={{ fontSize: '12px' }}
              />
            </XAxis>
            <YAxis
              type="number"
              dataKey="participation"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              name="Participation Rate"
            >
              <Label
                value="Participation Rate (%)"
                angle={-90}
                position="left"
                offset={45}
                style={{ fontSize: '12px' }}
              />
            </YAxis>

            {/* Category zones with colored backgrounds */}
            <ReferenceArea
              x1={66}
              x2={100}
              fill="#ffcdd2"
              fillOpacity={0.3}
              ifOverflow="extendDomain"
            />
            <ReferenceArea
              x1={33}
              x2={66}
              fill="#ffe0b2"
              fillOpacity={0.3}
              ifOverflow="extendDomain"
            />
            <ReferenceArea
              x1={10}
              x2={33}
              fill="#c8e6c9"
              fillOpacity={0.3}
              ifOverflow="extendDomain"
            />
            <ReferenceArea
              x1={0}
              x2={10}
              fill="#a5d6a7"
              fillOpacity={0.4}
              ifOverflow="extendDomain"
            />

            {/* Participation threshold area for Medium-High upgrade */}
            <ReferenceArea
              x1={10}
              x2={33}
              y1={10}
              y2={100}
              fill="#66bb6a"
              fillOpacity={0.2}
              stroke="#388e3c"
              strokeDasharray="3 3"
              ifOverflow="extendDomain"
            />

            {/* Economic decentralization thresholds */}
            <ReferenceLine 
              x={66} 
              stroke="#d32f2f" 
              strokeDasharray="3 3"
              label={{
                value: "Low Threshold (66%)",
                position: "top",
                style: { fontSize: '10px', fill: '#d32f2f' }
              }}
            />
            <ReferenceLine 
              x={33} 
              stroke="#f57c00" 
              strokeDasharray="3 3"
              label={{
                value: "Medium Threshold (33%)",
                position: "top",
                style: { fontSize: '10px', fill: '#f57c00' }
              }}
            />
            <ReferenceLine 
              x={10} 
              stroke="#388e3c" 
              strokeDasharray="3 3"
              label={{
                value: "High Threshold (10%)",
                position: "top",
                style: { fontSize: '10px', fill: '#388e3c' }
              }}
            />

            {/* Participation thresholds */}
            <ReferenceLine 
              y={10} 
              stroke="#666" 
              strokeDasharray="3 3"
              label={{
                value: "Min Participation (10%)",
                position: "right",
                style: { fontSize: '10px' }
              }}
            />
            <ReferenceLine 
              y={40} 
              stroke="#666" 
              strokeDasharray="3 3"
              label={{
                value: "High Participation (40%)",
                position: "right",
                style: { fontSize: '10px' }
              }}
            />

            {/* Data points by category */}
            {Object.entries(_.groupBy(data, 'category')).map(([category, items]) => (
              <Scatter
                key={`scatter-${category}`}
                name={category}
                data={items}
                fill={items[0].color}
              >
                {items.map((entry, index) => (
                  <Rectangle 
                    key={`rect-${index}`}
                    width={entry.automated ? 12 : 8}
                    height={entry.automated ? 12 : 8}
                    opacity={0.8}
                  />
                ))}
              </Scatter>
            ))}

            <Legend 
              verticalAlign="top" 
              height={36}
              formatter={(value) => {
                const categoryData = _.groupBy(data, 'category')[value] || [];
                const percentage = ((categoryData.length / data.length) * 100).toFixed(1);
                return (
                  <span style={{ fontSize: '12px' }}>
                    {value} Decentralization ({percentage}%)
                  </span>
                );
              }}
            />

            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-gray-200 shadow-lg rounded">
                      <p className="font-bold">{data.name}</p>
                      <p>Decentralization: {data.category}</p>
                      <p>Largest Holder: {data.largestHolder.toFixed(1)}%</p>
                      <p>Participation: {data.participation.toFixed(1)}%</p>
                      <p>On-chain Automation: {data.automated ? 'Yes' : 'No'}</p>
                      <p>Total Members: {data.totalMembers?.toLocaleString() || 'N/A'}</p>
                      <p>KPI Score: {data.score.toFixed(1)} / 3.0</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-5 text-sm">
        <p className="font-bold mb-2">Decentralization Analysis:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <p className="font-bold mb-1">Economic Decentralization:</p>
            <ul className="list-disc pl-5">
              <li>Low (Largest Holder &gt;66%): {stats.percentages.low.toFixed(1)}%</li>
              <li>Medium-Low (33-66%): {stats.percentages.mediumLow.toFixed(1)}%</li>
              <li>Medium (10-33%, &lt;10% participation or no automation): {stats.percentages.medium.toFixed(1)}%</li>
              <li>Medium-High (10-33%, &gt;10% participation, with automation): {stats.percentages.mediumHigh.toFixed(1)}%</li>
              <li>High (Largest Holder &lt;10%): {stats.percentages.high.toFixed(1)}%</li>
            </ul>
          </div>
          <div>
            <p className="font-bold mb-1">Participation Distribution:</p>
            <ul className="list-disc pl-5">
              <li>Low Participation (&lt;10%): {stats.participationPercentages.low.toFixed(1)}%</li>
              <li>Medium Participation (10-40%): {stats.participationPercentages.medium.toFixed(1)}%</li>
              <li>High Participation (&gt;40%): {stats.participationPercentages.high.toFixed(1)}%</li>
            </ul>
          </div>
        </div>
        <p className="mt-3 text-xs italic">
          <strong>Methodology note:</strong>
          The x-axis shows the percentage held by the largest token holder (lower values = more decentralized), while 
          the y-axis shows participation rate. The colored areas represent the decentralization classification thresholds, 
          with the darker green area (10-33% largest holder, &gt;10% participation) highlighting where DAOs can achieve 
          Medium-High classification if they implement on-chain automation.
        </p>
        <p className="mt-1 text-xs italic">
          Correlation between largest holder percentage and participation is {
            Math.abs(stats.correlation) < 0.3 ? 'weak' :
            Math.abs(stats.correlation) < 0.7 ? 'moderate' : 'strong'
          } (ρ = {stats.correlation.toFixed(2)}). 
          {stats.automated} DAOs ({((stats.automated/stats.n)*100).toFixed(1)}%) implement on-chain automation,
          which upgrades them from Medium to Medium-High category when other criteria are met.
        </p>
      </div>
    </div>
  );
};

export default DecentralizationAnalysisImproved3;
