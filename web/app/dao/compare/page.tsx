// app/dao/compare/page.tsx
'use client';

import React from 'react';
import { DAOSelectionProvider } from '../../../lib/context/DAOSelectionContext';
import CompareDAOPage from '../../../components/charts/multi-dao/CompareDAOPage';

export default function CompareDAOs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/30">
      <div className="page-container fade-in">
        <CompareDAOPage />
      </div>
    </div>
  );
}