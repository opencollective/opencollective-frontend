import React from 'react';
import { DashboardSectionProps } from '../../types';
import DashboardHeader from '../../DashboardHeader';
import { SearchResults } from '@/components/search/SearchResultsPage';

export default function SearchSection(props: DashboardSectionProps) {
  return (
    <div className="space-y-4">
      <DashboardHeader title="Search" />
      <SearchResults />
    </div>
  );
}
