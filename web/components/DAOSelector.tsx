// components/DAOSelector.tsx
import React from 'react';
import { useDAOSelection } from '../lib/context/DAOSelectionContext';

interface DAOSelectorProps {
  daos: Array<{
    id: number;
    name: string;
  }>;
}

export function DAOSelector({ daos }: DAOSelectorProps) {
  const { selectedDAOIds, toggleDAOSelection, clearSelection, selectAll } = useDAOSelection();
  
  return (
    <div className="space-y-4 p-4 border rounded-md">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Select DAOs for Comparison</h3>
        <div className="space-x-2">
          <button 
            onClick={clearSelection}
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md"
          >
            Clear All
          </button>
          <button 
            onClick={() => selectAll()}
            className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md"
          >
            Select All
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {daos.map(dao => (
          <div 
            key={dao.id}
            className={`p-2 border rounded-md cursor-pointer ${
              selectedDAOIds.includes(dao.id) 
                ? 'bg-blue-100 border-blue-500' 
                : 'bg-white hover:bg-gray-50'
            }`}
            onClick={() => toggleDAOSelection(dao.id)}
          >
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                checked={selectedDAOIds.includes(dao.id)}
                onChange={() => toggleDAOSelection(dao.id)}
                className="h-4 w-4"
              />
              <span>{dao.name}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-sm text-gray-600">
        {selectedDAOIds.length} DAOs selected
      </div>
    </div>
  );
}