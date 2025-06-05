"use client"

// lib/context/DAOSelectionContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface DAOSelectionContextType {
  selectedDAOIds: number[];
  setSelectedDAOIds: (ids: number[]) => void;
  toggleDAOSelection: (id: number) => void;
  isDAOSelected: (id: number) => boolean;
  clearSelection: () => void;
  selectAll: () => void;
  getSelectedDAOs: () => any[];
}

const DAOSelectionContext = createContext<DAOSelectionContextType | undefined>(undefined);

interface DAOSelectionProviderProps {
  children: ReactNode;
  maxSelections?: number;
}

export const DAOSelectionProvider: React.FC<DAOSelectionProviderProps> = ({
  children,
  maxSelections = 20
}) => {
  // Use client-side only state for hydration safety
  const [isMounted, setIsMounted] = useState(false);
  
  // Use localStorage to persist selections between page reloads
  const [selectedDAOIds, setSelectedDAOIds] = useLocalStorage<number[]>('selectedDAOIds', []);
  const [allDAOs, setAllDAOs] = useState<any[]>([]);

  // Mark component as mounted to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch all DAOs on mount - use API endpoint instead of direct JSON
  useEffect(() => {
    // Skip the fetch during SSR to avoid hydration issues
    if (!isMounted) return;
    
    const fetchDAOs = async () => {
      try {
        // Try to use API first
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        let response;
        let transformedData;
        
        try {
          // Try to fetch from API
          response = await fetch(`${apiUrl}/daos?limit=100`);
          if (response.ok) {
            const data = await response.json();
            transformedData = data.items;
          } else {
            throw new Error('API not available, falling back to local data');
          }
        } catch (apiError) {
          console.warn("API fetch failed, falling back to local data:", apiError);
          // Fallback to local JSON if API fails
          response = await fetch('/dao_data.json');
          const jsonData = await response.json();
          
          // Transform the data to match our expected format
          transformedData = jsonData.map((dao: any, index: number) => ({
            id: index + 1,
            name: dao.dao_name,
            chain_id: dao.chain_id.toString(),
          }));
        }
        
        setAllDAOs(transformedData);
        
        // Check if selectedDAOIds exists in localStorage
        const storedDAOs = localStorage.getItem('selectedDAOIds');
        const hasStoredDAOs = storedDAOs && JSON.parse(storedDAOs).length > 0;
        
        // Only auto-select if there's no stored data and the component is mounting for the first time
        // Remove auto-selection to let user choose manually
        if (!hasStoredDAOs && selectedDAOIds.length === 0) {
          // Don't auto-select anything - let the user choose
          console.log('No stored DAOs found, starting with empty selection');
        }
      } catch (err) {
        console.error("Error fetching DAOs:", err);
      }
    };
    
    fetchDAOs();
  }, [isMounted]); // Remove selectedDAOIds.length dependency to avoid loop

  // Ensure we don't exceed max selections
  useEffect(() => {
    if (!isMounted) return; // Skip during SSR
    
    if (selectedDAOIds.length > maxSelections) {
      setSelectedDAOIds(selectedDAOIds.slice(0, maxSelections));
    }
  }, [isMounted, selectedDAOIds, maxSelections, setSelectedDAOIds]);

  // Toggle a single DAO selection
  const toggleDAOSelection = (id: number) => {
    if (selectedDAOIds.includes(id)) {
      setSelectedDAOIds(selectedDAOIds.filter(daoId => daoId !== id));
    } else {
      if (selectedDAOIds.length < maxSelections) {
        setSelectedDAOIds([...selectedDAOIds, id]);
      } else {
        console.warn(`Maximum of ${maxSelections} DAOs can be selected.`);
        // Could also show a toast notification here
      }
    }
  };

  // Check if a DAO is selected
  const isDAOSelected = (id: number) => {
    return selectedDAOIds.includes(id);
  };

  // Clear all selections
  const clearSelection = () => {
    console.log('Clearing selection, before:', selectedDAOIds);
    setSelectedDAOIds([]);
  };

  // Select all DAOs (up to maxSelections)
  const selectAll = () => {
    if (!allDAOs || allDAOs.length === 0) return;
    
    const allIds = allDAOs.map(dao => dao.id);
    if (allIds.length > maxSelections) {
      setSelectedDAOIds(allIds.slice(0, maxSelections));
    } else {
      setSelectedDAOIds(allIds);
    }
  };

  // Get the full DAO objects for selected IDs
  const getSelectedDAOs = () => {
    if (!allDAOs || allDAOs.length === 0) return [];
    return allDAOs.filter(dao => selectedDAOIds.includes(dao.id));
  };

  // Create safe versions that work during SSR
  const safeContextValue: DAOSelectionContextType = {
    selectedDAOIds: isMounted ? selectedDAOIds : [],
    setSelectedDAOIds: isMounted ? setSelectedDAOIds : () => {},
    toggleDAOSelection: isMounted ? toggleDAOSelection : () => {},
    isDAOSelected: isMounted ? isDAOSelected : () => false,
    clearSelection: isMounted ? clearSelection : () => {},
    selectAll: isMounted ? selectAll : () => {},
    getSelectedDAOs: isMounted ? getSelectedDAOs : () => [],
  };

  return (
    <DAOSelectionContext.Provider value={safeContextValue}>
      {children}
    </DAOSelectionContext.Provider>
  );
};

// Custom hook to use the DAO selection context
export function useDAOSelection() {
  const context = useContext(DAOSelectionContext);
  if (context === undefined) {
    throw new Error('useDAOSelection must be used within a DAOSelectionProvider');
  }
  return context;
}