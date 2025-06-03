'use client';

import React, { useMemo } from 'react';

interface VisualizationWrapperProps {
  children?: React.ReactNode;
  component: React.ComponentType<any>;
  data?: any[]; // Data to be passed to the component
  selectedDAOIds?: number[]; // IDs of selected DAOs
  includeAllData?: boolean; // Whether to include all data or just selected DAOs
}

export function VisualizationWrapper({ 
  children, 
  component: Component, 
  data, 
  selectedDAOIds = [],
  includeAllData = false 
}: VisualizationWrapperProps) {
  
  // Filter data based on selected DAOs or use all data
  const filteredData = useMemo(() => {
    if (!data) return [];
    
    if (includeAllData || selectedDAOIds.length === 0) {
      return data;
    }
    
    return data.filter(dao => selectedDAOIds.includes(dao.id));
  }, [data, selectedDAOIds, includeAllData]);
  
  return (
    <div className="visualization-wrapper">
      <Component data={filteredData}>
        {children}
      </Component>
    </div>
  );
}