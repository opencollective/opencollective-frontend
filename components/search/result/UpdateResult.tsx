import React from 'react';

import type { SearchUpdateFieldsFragment } from '@/lib/graphql/types/v2/graphql';

import Avatar from '../../Avatar';
import { Highlight } from '../Highlight';
import { getHighlightsFields } from '../lib';
import type { SearchHighlights } from '../types';

export function UpdateResult({
  update,
  highlights,
}: {
  update: SearchUpdateFieldsFragment;
  highlights?: SearchHighlights;
}) {
  const highlightFields = getHighlightsFields(highlights, ['title', 'html']);
  return (
    <div className="flex flex-1 items-center gap-2">
      <Avatar collective={update.account} size={36} />

      <div className="overflow-hidden">
        <div className="truncate font-medium">
          <Highlight content={highlightFields.top.title?.[0] || update.title} />
        </div>
        <div className="truncate text-muted-foreground italic">
          <Highlight content={highlightFields.top.html?.[0] || update.html} />
        </div>
      </div>
    </div>
  );
}
