import React from 'react';
import { useIntl } from 'react-intl';

import { SearchResults } from '@/components/search/SearchResultsPage';

import DashboardHeader from '../../DashboardHeader';

export default function SearchSection() {
  const intl = useIntl();
  return (
    <div className="space-y-4">
      <DashboardHeader title={intl.formatMessage({ defaultMessage: 'Search', id: 'Search' })} />
      <SearchResults />
    </div>
  );
}
