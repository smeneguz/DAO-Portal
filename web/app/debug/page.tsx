'use client';

import React, { useEffect, useState } from 'react';

export default function DebugPage() {
  const [apiTest, setApiTest] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [allDAOs, setAllDAOs] = useState<any[]>([]);
  const [navbarTest, setNavbarTest] = useState<any>(null);

  useEffect(() => {
    const testAPI = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        console.log('Testing API URL:', apiUrl);
        
        // Test single DAO
        const response = await fetch(`${apiUrl}/daos/1`);
        console.log('Single DAO Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Single DAO Response data:', data);
        setApiTest(data);

        // Test all DAOs endpoint
        const allResponse = await fetch(`${apiUrl}/daos`);
        console.log('All DAOs Response status:', allResponse.status);
        
        if (allResponse.ok) {
          const allData = await allResponse.json();
          console.log('All DAOs Response:', allData);
          setAllDAOs(Array.isArray(allData) ? allData.slice(0, 5) : []);
        }
        
      } catch (err) {
        console.error('API Test Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    const testNavbar = () => {
      if (typeof window !== 'undefined') {
        const navbar = document.querySelector('header');
        const navContainer = navbar?.querySelector('.container');
        const flexContainer = navContainer?.firstElementChild;
        
        setNavbarTest({
          exists: !!navbar,
          classes: navbar?.className || 'Not found',
          containerClasses: navContainer?.className || 'Not found',
          flexClasses: flexContainer?.className || 'Not found',
          isHorizontal: flexContainer?.classList.contains('flex') && flexContainer?.classList.contains('justify-between')
        });
      }
    };

    testAPI();
    // Test navbar after a short delay to ensure it's rendered
    setTimeout(testNavbar, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/98 to-muted/20 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Debug Page</h1>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Environment Variables</h2>
          <div className="bg-card p-4 rounded-lg">
            <p><strong>NEXT_PUBLIC_API_URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Navbar Layout Test</h2>
          <div className="bg-card p-4 rounded-lg">
            {navbarTest ? (
              <div className="space-y-2">
                <p><strong>Navbar exists:</strong> {navbarTest.exists ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Header classes:</strong> <code className="bg-muted px-1 rounded">{navbarTest.classes}</code></p>
                <p><strong>Container classes:</strong> <code className="bg-muted px-1 rounded">{navbarTest.containerClasses}</code></p>
                <p><strong>Flex classes:</strong> <code className="bg-muted px-1 rounded">{navbarTest.flexClasses}</code></p>
                <p><strong>Is horizontal layout:</strong> {navbarTest.isHorizontal ? '✅ Yes' : '❌ No'}</p>
              </div>
            ) : (
              <p>Testing navbar...</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">API Test (DAO ID 1)</h2>
          <div className="bg-card p-4 rounded-lg">
            {error ? (
              <div className="text-red-500">
                <p><strong>Error:</strong> {error}</p>
              </div>
            ) : apiTest ? (
              <div className="text-green-600">
                <p><strong>Success:</strong></p>
                <pre className="mt-2 text-sm bg-muted p-2 rounded">
                  {JSON.stringify(apiTest, null, 2)}
                </pre>
              </div>
            ) : (
              <p>Loading...</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">All DAOs Sample</h2>
          <div className="bg-card p-4 rounded-lg">
            {allDAOs.length > 0 ? (
              <div className="space-y-2">
                <p><strong>Found {allDAOs.length} DAOs (showing first 5):</strong></p>
                {allDAOs.map((dao, index) => (
                  <div key={dao.id || index} className="bg-muted p-2 rounded">
                    <p><strong>ID:</strong> {dao.id} | <strong>Name:</strong> {dao.name} | <strong>Chain:</strong> {dao.chain_id}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No DAOs loaded yet...</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Current URL Information</h2>
          <div className="bg-card p-4 rounded-lg">
            <p><strong>Window Location:</strong> {typeof window !== 'undefined' ? window.location.href : 'Server-side'}</p>
            <p><strong>Node Environment:</strong> {process.env.NODE_ENV}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Links</h2>
          <div className="space-x-4">
            <a href="/dao/1" className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90">
              Go to DAO 1
            </a>
            <a href="/dao" className="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/90">
              All DAOs
            </a>
            <a href="/" className="bg-accent text-accent-foreground px-4 py-2 rounded hover:bg-accent/90">
              Home
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Direct API Test</h2>
          <div className="bg-card p-4 rounded-lg">
            <p>Test these URLs in your browser:</p>
            <ul className="space-y-1 mt-2">
              <li><a href="http://localhost:8000/api/v1/daos/1" target="_blank" className="text-blue-600 underline">http://localhost:8000/api/v1/daos/1</a></li>
              <li><a href="http://localhost:8000/api/v1/daos" target="_blank" className="text-blue-600 underline">http://localhost:8000/api/v1/daos</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
