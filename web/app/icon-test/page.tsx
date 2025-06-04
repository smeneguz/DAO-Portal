// Test page to showcase the new icon system
"use client";

import React from 'react';
import {
  DashboardIcon,
  CompareIcon,
  AnalyticsIcon,
  SearchIcon,
  FilterIcon,
  BackIcon,
  ViewIcon,
  RefreshIcon,
  ExportIcon,
  ErrorIcon,
  SuccessIcon,
  WarningIcon,
  InfoIcon,
  LoadingIcon,
  VotingIcon,
  ParticipationIcon,
  TreasuryIcon,
  TokenIcon,
  DecentralizationIcon,
  EmptyStateIcon,
  SettingsIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronRightIcon,
  TrashIcon,
  ClockIcon,
  LightBulbIcon,
  AddIcon
} from '../../components/ui/icons';

export default function IconTestPage() {
  const icons = [
    { name: 'DashboardIcon', component: DashboardIcon, category: 'Navigation' },
    { name: 'CompareIcon', component: CompareIcon, category: 'Navigation' },
    { name: 'AnalyticsIcon', component: AnalyticsIcon, category: 'Navigation' },
    { name: 'SearchIcon', component: SearchIcon, category: 'Actions' },
    { name: 'FilterIcon', component: FilterIcon, category: 'Actions' },
    { name: 'BackIcon', component: BackIcon, category: 'Navigation' },
    { name: 'ViewIcon', component: ViewIcon, category: 'Actions' },
    { name: 'RefreshIcon', component: RefreshIcon, category: 'Actions' },
    { name: 'ExportIcon', component: ExportIcon, category: 'Actions' },
    { name: 'ErrorIcon', component: ErrorIcon, category: 'Status' },
    { name: 'SuccessIcon', component: SuccessIcon, category: 'Status' },
    { name: 'WarningIcon', component: WarningIcon, category: 'Status' },
    { name: 'InfoIcon', component: InfoIcon, category: 'Status' },
    { name: 'LoadingIcon', component: LoadingIcon, category: 'Status' },
    { name: 'VotingIcon', component: VotingIcon, category: 'DAO' },
    { name: 'ParticipationIcon', component: ParticipationIcon, category: 'DAO' },
    { name: 'TreasuryIcon', component: TreasuryIcon, category: 'DAO' },
    { name: 'TokenIcon', component: TokenIcon, category: 'DAO' },
    { name: 'DecentralizationIcon', component: DecentralizationIcon, category: 'DAO' },
    { name: 'EmptyStateIcon', component: EmptyStateIcon, category: 'Status' },
    { name: 'SettingsIcon', component: SettingsIcon, category: 'Actions' },
    { name: 'ChevronDownIcon', component: ChevronDownIcon, category: 'Navigation' },
    { name: 'ChevronUpIcon', component: ChevronUpIcon, category: 'Navigation' },
    { name: 'ChevronRightIcon', component: ChevronRightIcon, category: 'Navigation' },
    { name: 'TrashIcon', component: TrashIcon, category: 'Actions' },
    { name: 'ClockIcon', component: ClockIcon, category: 'Status' },
    { name: 'LightBulbIcon', component: LightBulbIcon, category: 'Status' },
    { name: 'AddIcon', component: AddIcon, category: 'Actions' }
  ];

  const sizes: Array<'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = ['xxs', 'xs', 'sm', 'md', 'lg', 'xl'];
  const sizeDescriptions = {
    xxs: '8px - Ultra-small',
    xs: '10px - Very small',
    sm: '12px - Small (default)',
    md: '14px - Medium',
    lg: '16px - Large',
    xl: '20px - Extra large'
  };

  const groupedIcons = icons.reduce((acc, icon) => {
    if (!acc[icon.category]) {
      acc[icon.category] = [];
    }
    acc[icon.category].push(icon);
    return acc;
  }, {} as Record<string, typeof icons>);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">DAO Portal Icon System</h1>
          <p className="text-muted-foreground">
            Comprehensive semantic icon component system with proper sizing and accessibility
          </p>
        </div>

        {/* Size Comparison */}
        <div className="mb-12 p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-4">Size Comparison</h2>
          <div className="grid grid-cols-6 gap-4">
            {sizes.map(size => (
              <div key={size} className="text-center">
                <div className="mb-2 font-mono text-sm">{size}</div>
                <div className="mb-1 text-xs text-muted-foreground">{sizeDescriptions[size]}</div>
                <div className="flex justify-center items-center h-12 border rounded bg-muted/30">
                  <DashboardIcon size={size} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Icon Categories */}
        {Object.entries(groupedIcons).map(([category, categoryIcons]) => (
          <div key={category} className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{category} Icons</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categoryIcons.map(({ name, component: IconComponent }) => (
                <div key={name} className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <IconComponent size="md" className="text-primary" />
                    <div className="font-medium text-sm">{name}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <IconComponent size="xs" />
                    <span>xs</span>
                    <IconComponent size="sm" />
                    <span>sm</span>
                    <IconComponent size="lg" />
                    <span>lg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Usage Examples */}
        <div className="mt-12 p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-4">Usage Examples</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded">
              <ErrorIcon size="sm" className="text-destructive" />
              <span>Error message with semantic icon</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded">
              <SuccessIcon size="sm" className="text-green-600" />
              <span>Success message with semantic icon</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded">
              <LoadingIcon size="sm" className="text-primary" />
              <span>Loading state with animated icon</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded">
              <TreasuryIcon size="sm" className="text-primary" />
              <span>$1,234,567</span>
              <span className="text-muted-foreground">Treasury Balance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
