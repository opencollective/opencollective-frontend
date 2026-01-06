import React from 'react';
import { FormattedMessage } from 'react-intl';

import Page from '@/components/Page';
import { SearchResults } from '@/components/search/SearchResultsPage';

// next.js export
// ts-unused-exports:disable-next-line
export default function GlobalSearchResultsPage() {
  return (
    <Page showSearch={false}>
      <div className="mx-auto max-w-5xl space-y-4 py-12">
        <h1 className="flex items-center gap-1.5 text-2xl leading-9 font-bold tracking-tight">
          <FormattedMessage defaultMessage="Search" id="Search" />
        </h1>
        <SearchResults />
      </div>
    </Page>
  );
}
