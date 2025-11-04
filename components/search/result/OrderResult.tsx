import React from 'react';
import { Markup } from 'interweave';

import type { SearchOrderFieldsFragment } from '@/lib/graphql/types/v2/graphql';

import Avatar from '../../Avatar';
import { Badge } from '../../ui/Badge';
import { getHighlightsFields } from '../lib';
import type { SearchHighlights } from '../types';
import { Highlight } from '../Highlight';

export function OrderResult({
  order,
  highlights,
}: {
  order: SearchOrderFieldsFragment;
  highlights?: SearchHighlights;
}) {
  const highlightFields = getHighlightsFields(highlights, ['id', 'description']);
  const otherHighlight = Object.values(highlightFields.others)[0]?.[0];
  return (
    <div className="flex flex-1 items-center gap-2">
      <Avatar collective={order.toAccount} size={36} />

      <div className="overflow-hidden">
        <div className="mb-1 flex gap-1">
          <Badge type="outline" size="xs">
            {highlightFields.top.id ? <Highlight content={`#${highlightFields.top.id[0]}`} /> : `#${order.legacyId}`}
          </Badge>
          <div className="truncate">
            Order from <span className="text-foreground">{order.fromAccount.name}</span>
            to <span className="text-foreground">{order.toAccount.name}</span>
          </div>
        </div>
        <div className="truncate font-medium text-muted-foreground">
          <Highlight content={highlightFields.top.description?.[0] || order.description} />
        </div>
        {otherHighlight && (
          <div className="truncate">
            <Highlight className="text-muted-foreground italic" content={otherHighlight} />
          </div>
        )}
      </div>
    </div>
  );
}
