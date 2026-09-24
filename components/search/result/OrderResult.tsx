import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { SearchOrderFieldsFragment } from '@/lib/graphql/types/v2/graphql';

import Avatar from '../../Avatar';
import { Badge } from '../../ui/Badge';
import { Highlight } from '../Highlight';
import { getHighlightsFields } from '../lib';
import type { SearchHighlights } from '../types';

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
            <Highlight content={`#${highlightFields.top.id?.[0] || order.legacyId}`} />
          </Badge>
          <div className="truncate">
            <FormattedMessage
              defaultMessage="Contribution from {fromAccount} to {toAccount}"
              id="HV6RkT"
              values={{
                fromAccount: <span className="text-foreground">{order.fromAccount?.name || 'Incognito'}</span>,
                toAccount: <span className="text-foreground">{order.toAccount.name}</span>,
              }}
            />
          </div>
        </div>

        <Highlight
          content={highlightFields.top.description?.[0] || order.description}
          className="block truncate font-medium text-muted-foreground"
        />
        {otherHighlight && (
          <Highlight className="block truncate text-muted-foreground italic" content={otherHighlight} />
        )}
      </div>
    </div>
  );
}
