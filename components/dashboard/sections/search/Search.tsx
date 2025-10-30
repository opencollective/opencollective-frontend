import React from 'react';

import { SearchResults } from '@/components/search/SearchResultsPage';

import DashboardHeader from '../../DashboardHeader';

export default function SearchSection() {
  return (
    <div className="space-y-4">
      <DashboardHeader title="Search" />
      <SearchResults />
    </div>
  );
}
