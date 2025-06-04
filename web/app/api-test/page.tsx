'use client';

import { useEffect, useState } from 'react';

export default function ApiTestPage() {
  const [results, setResults] = useState<any>({});
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testDirectFetch = async () => {
    addLog('Starting direct fetch test...');
    try {
      const response = await fetch('http://localhost:8000/api/v1/daos/1');
      addLog(`Direct fetch response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        addLog('Direct fetch successful');
        setResults(prev => ({ ...prev, direct: data }));
      } else {
        addLog(`Direct fetch failed: ${response.statusText}`);
        setResults(prev => ({ ...prev, direct: { error: response.statusText } }));
      }
    } catch (error) {
      addLog(`Direct fetch error: ${error}`);
      setResults(prev => ({ ...prev, direct: { error: error.toString() } }));
    }
  };

  const testEnvFetch = async () => {
    addLog('Starting environment variable fetch test...');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    addLog(`Using API URL: ${apiUrl}`);
    
    try {
      const response = await fetch(`${apiUrl}/daos/1`);
      addLog(`Env fetch response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        addLog('Env fetch successful');
        setResults(prev => ({ ...prev, env: data }));
      } else {
        addLog(`Env fetch failed: ${response.statusText}`);
        setResults(prev => ({ ...prev, env: { error: response.statusText } }));
      }
    } catch (error) {
      addLog(`Env fetch error: ${error}`);
      setResults(prev => ({ ...prev, env: { error: error.toString() } }));
    }
  };

  const testProxy = async () => {
    addLog('Testing if Next.js API route proxy works...');
    try {
      // Test if we can create a proxy route
      const response = await fetch('/api/test-dao');
      addLog(`Proxy test response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        addLog('Proxy test successful');
        setResults(prev => ({ ...prev, proxy: data }));
      } else {
        addLog(`Proxy test failed: ${response.statusText}`);
        setResults(prev => ({ ...prev, proxy: { error: response.statusText } }));
      }
    } catch (error) {
      addLog(`Proxy test error: ${error}`);
      setResults(prev => ({ ...prev, proxy: { error: error.toString() } }));
    }
  };

  useEffect(() => {
    // Run tests with delays
    setTimeout(testDirectFetch, 500);
    setTimeout(testEnvFetch, 1500);
    setTimeout(testProxy, 2500);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/98 to-muted/20 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">API Connection Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-4">Test Results</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Direct Fetch (localhost:8000)</h3>
                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                    {JSON.stringify(results.direct || 'Not tested yet', null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-medium">Environment Variable Fetch</h3>
                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                    {JSON.stringify(results.env || 'Not tested yet', null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-medium">Proxy Test</h3>
                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                    {JSON.stringify(results.proxy || 'Not tested yet', null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Test Log</h2>
            <div className="bg-muted p-4 rounded max-h-96 overflow-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-xs font-mono mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Manual Tests</h2>
          <div className="space-x-4">
            <button 
              onClick={testDirectFetch}
              className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
            >
              Retry Direct
            </button>
            <button 
              onClick={testEnvFetch}
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/90"
            >
              Retry Env
            </button>
            <button 
              onClick={testProxy}
              className="bg-accent text-accent-foreground px-4 py-2 rounded hover:bg-accent/90"
            >
              Retry Proxy
            </button>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Environment Info</h2>
          <div className="space-y-2 text-sm">
            <p><strong>NEXT_PUBLIC_API_URL:</strong> {process.env.NEXT_PUBLIC_API_URL}</p>
            <p><strong>Window Location:</strong> {typeof window !== 'undefined' ? window.location.origin : 'SSR'}</p>
            <p><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'SSR'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
