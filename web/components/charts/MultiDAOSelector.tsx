// components/charts/MultiDAOSelector.tsx
import React, { useState, useEffect } from 'react';
import { Checkbox } from '../ui/checkbox';
import { useDAOs } from '../../lib/hooks/useDAOs';

interface MultiDAOSelectorProps {
  selectedDAOs: number[];
  setSelectedDAOs: (ids: number[]) => void;
  maxItems?: number;
}

export const MultiDAOSelector: React.FC<MultiDAOSelectorProps> = ({
  selectedDAOs,
  setSelectedDAOs,
  maxItems = 20
}) => {
  const { data, isLoading, error } = useDAOs();
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    // Auto-select first 5 DAOs if nothing is selected yet
    if (data && data.length > 0 && selectedDAOs.length === 0) {
      setSelectedDAOs(data.slice(0, 5).map(dao => dao.id));
    }
  }, [data, selectedDAOs, setSelectedDAOs]);

  if (isLoading) return <div>Loading DAOs...</div>;
  if (error) return <div className="text-red-500">Error loading DAOs</div>;

  const filteredDAOs = data?.filter(dao => 
    dao.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleToggleDAO = (daoId: number) => {
    if (selectedDAOs.includes(daoId)) {
      setSelectedDAOs(selectedDAOs.filter(id => id !== daoId));
    } else {
      if (selectedDAOs.length < maxItems) {
        setSelectedDAOs([...selectedDAOs, daoId]);
      } else {
        alert(`Maximum ${maxItems} DAOs can be selected at once for optimal performance.`);
      }
    }
  };

  const handleSelectAll = () => {
    if (filteredDAOs.length > maxItems) {
      alert(`Maximum ${maxItems} DAOs can be selected at once. Selecting first ${maxItems} from filtered results.`);
      setSelectedDAOs(filteredDAOs.slice(0, maxItems).map(dao => dao.id));
    } else {
      setSelectedDAOs(filteredDAOs.map(dao => dao.id));
    }
  };

  const handleClearAll = () => {
    setSelectedDAOs([]);
  };

  return (
    <div className="border rounded-md p-4 dark:border-gray-700">
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Select DAOs to Compare</h3>
        <div className="relative">
          <input
            type="text"
            placeholder="Search DAOs..."
            className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      <div className="flex justify-between mb-4">
        <span className="text-sm text-gray-500">
          {selectedDAOs.length} of {maxItems} selected
        </span>
        <div className="space-x-2">
          <button 
            onClick={handleSelectAll}
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            Select All
          </button>
          <button 
            onClick={handleClearAll}
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            Clear All
          </button>
        </div>
      </div>
      
      <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
        {filteredDAOs.length === 0 ? (
          <div className="text-gray-500 text-center py-4">No DAOs found</div>
        ) : (
          filteredDAOs.map(dao => (
            <div key={dao.id} className="flex items-center space-x-2">
              <Checkbox
                id={`dao-${dao.id}`}
                checked={selectedDAOs.includes(dao.id)}
                onCheckedChange={() => handleToggleDAO(dao.id)}
              />
              <label
                htmlFor={`dao-${dao.id}`}
                className="text-sm cursor-pointer flex justify-between w-full"
              >
                <span>{dao.name}</span>
                <span className="text-gray-500 text-xs">{dao.chain_id}</span>
              </label>
            </div>
          ))
        )}
      </div>
    </div>
  );
};