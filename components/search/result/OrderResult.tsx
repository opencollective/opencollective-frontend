import React from 'react';
import { Markup } from 'interweave';

import Avatar from '../../Avatar';
import { getHighlightsFields } from '../lib';
import type { SearchHighlights } from '../types';
import type { OrderResultData } from '../useRecentlyVisited';

export function OrderResult({ order, highlights }: { order: OrderResultData; highlights?: SearchHighlights }) {
  const highlightFields = getHighlightsFields(highlights, ['description']);
  const otherHighlight = Object.values(highlightFields.others)[0]?.[0];
  return (
    <div className="flex flex-1 items-center gap-2">
      <Avatar collective={order.toAccount} size={36} />

      <div className="overflow-hidden">
        <div className="truncate">
          Order from <span className="text-foreground">{order.fromAccount.name}</span>
          to <span className="text-foreground">{order.toAccount.name}</span>
        </div>
        <div className="truncate font-medium text-muted-foreground">
          <Markup allowList={['mark']} content={highlightFields.top.description?.[0] || order.description} />
        </div>
        {otherHighlight && (
          <div className="truncate">
            <Markup className="italic text-muted-foreground" allowList={['mark']} content={otherHighlight} />
          </div>
        )}
      </div>
    </div>
  );
}
