"use client";

import { useState } from 'react';

function ConnectivityTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    const results: string[] = [];

    // Test 1: Direct API call to backend
    try {
      results.push('🔍 Testing direct backend API call...');
      const response = await fetch('http://localhost:8000/api/v1/daos?limit=5');
      if (response.ok) {
        const data = await response.json();
        results.push(`✅ Backend API: ${data.items?.length || 0} DAOs found`);
      } else {
        results.push(`❌ Backend API error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      results.push(`❌ Backend API error: ${error}`);
    }

    // Test 2: Next.js API route
    try {
      results.push('🔍 Testing Next.js API route...');
      const response = await fetch('/api/test-dao');
      if (response.ok) {
        const data = await response.json();
        results.push(`✅ Next.js API Route: Success - ${data.count} items`);
      } else {
        results.push(`❌ Next.js API Route error: ${response.status}`);
      }
    } catch (error) {
      results.push(`❌ Next.js API Route error: ${error}`);
    }

    // Test 3: Environment variables
    results.push('🔍 Testing environment variables...');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    results.push(`📍 NEXT_PUBLIC_API_URL: ${apiUrl || 'NOT SET'}`);

    // Test 4: Fetch specific DAO
    try {
      results.push('🔍 Testing specific DAO fetch...');
      const response = await fetch('http://localhost:8000/api/v1/daos/1');
      if (response.ok) {
        const dao = await response.json();
        results.push(`✅ DAO #1: ${dao.name} (${dao.chain_id})`);
      } else {
        results.push(`❌ DAO #1 error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      results.push(`❌ DAO #1 error: ${error}`);
    }

    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">API Connectivity Test</h1>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <button
              onClick={runTests}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {isLoading ? 'Running Tests...' : 'Run Connectivity Tests'}
            </button>
          </div>

          {testResults.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
              <div className="space-y-2 font-mono text-sm">
                {testResults.map((result, index) => (
                  <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Navigation Test:</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="/" className="block p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <h3 className="font-semibold">Home Page</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Dashboard with DAO selection</p>
              </a>
              <a href="/dao" className="block p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                <h3 className="font-semibold">All DAOs</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Paginated DAO list</p>
              </a>
              <a href="/dao/1" className="block p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                <h3 className="font-semibold">DAO #1 Details</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Individual DAO page</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConnectivityTest;
