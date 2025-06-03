// app/dao/compare/page.tsx
'use client';

import React from 'react';
import { DAOSelectionProvider } from '../../../lib/context/DAOSelectionContext';
import CompareDAOPage from '../../../components/charts/multi-dao/CompareDAOPage';

export default function CompareDAOs() {
  return (
    <div className="container mx-auto py-8">
      <CompareDAOPage />
    </div>
  );
}