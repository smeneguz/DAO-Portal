'use client';

import React, { useState } from 'react';
import { useDAOsQuery } from '../../lib/hooks/useDAOsQuery';

export default function SearchTest() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: daos, isLoading, error } = useDAOsQuery({
    searchQuery
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Search Test Page</h1>
      
      <div className="mb-4">
        <input 
          type="text"
          placeholder="Type to search DAOs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border p-2 rounded w-full max-w-md"
        />
      </div>
      
      <div className="mb-4">
        <p>Search Query: "{searchQuery}"</p>
        <p>Loading: {isLoading.toString()}</p>
        <p>Error: {error?.message || 'None'}</p>
        <p>Results Count: {daos?.length || 0}</p>
      </div>
      
      {daos && (
        <div className="space-y-2">
          <h3 className="font-semibold">Results:</h3>
          {daos.map(dao => (
            <div key={dao.id} className="border p-2 rounded">
              <strong>{dao.name}</strong> (Chain: {dao.chain_id})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
