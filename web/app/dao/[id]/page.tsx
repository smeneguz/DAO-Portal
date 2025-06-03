// app/dao/[id]/page.tsx
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { SingleDAOCharts } from '../../../components/charts/SingleDAOCharts';
import { useDAO } from '../../../lib/hooks/useDAO';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import Link from 'next/link';
import { useDAOSelection } from '../../../lib/context/DAOSelectionContext';

export default function DAODetail() {
  const { id } = useParams();
  const daoId = parseInt(id as string, 10);
  const { data: dao, isLoading, error } = useDAO(daoId);
  const { isDAOSelected, toggleDAOSelection } = useDAOSelection();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error || !dao) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-red-800 mb-4">Error</h2>
          <p className="text-red-600">
            {error?.message || "Failed to load DAO data"}
          </p>
          <Link href="/" className="inline-block mt-4 text-blue-500 hover:underline">
            Return to DAOs list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{dao.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">Chain ID: {dao.chain_id}</p>
        </div>
        <div className="flex gap-4">
          <Button
            variant={isDAOSelected(daoId) ? "default" : "outline"}
            onClick={() => toggleDAOSelection(daoId)}
          >
            {isDAOSelected(daoId) ? "Selected for Comparison" : "Add to Comparison"}
          </Button>
          <Link href="/dao/compare">
            <Button variant="outline">Compare DAOs</Button>
          </Link>
        </div>
      </div>

      {dao.description && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{dao.description}</p>
          </CardContent>
        </Card>
      )}

      <SingleDAOCharts daoId={daoId} daoName={dao.name} />
    </div>
  );
}
