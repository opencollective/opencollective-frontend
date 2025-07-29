import React from 'react';
import { Markup } from 'interweave';

import Avatar from '../../Avatar';
import { getHighlightsFields } from '../lib';
import type { SearchHighlights } from '../types';
import type { UpdateResultData } from '../useRecentlyVisited';

export function UpdateResult({ update, highlights }: { update: UpdateResultData; highlights?: SearchHighlights }) {
  const highlightFields = getHighlightsFields(highlights, ['title', 'html']);
  return (
    <div className="flex flex-1 items-center gap-2">
      <Avatar collective={update.account} size={36} />

      <div className="overflow-hidden">
        <div className="truncate font-medium">
          <Markup allowList={['mark']} content={highlightFields.top.title?.[0] || update.title} />
        </div>
        <div className="truncate text-muted-foreground italic">
          <Markup allowList={['mark']} content={highlightFields.top.html?.[0] || update.html} />
        </div>
      </div>
    </div>
  );
}
