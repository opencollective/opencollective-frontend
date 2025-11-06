import React from 'react';
import { useIntl } from 'react-intl';

import formatCollectiveType from '../../../lib/i18n/collective-type';
import type { SearchAccountFieldsFragment } from '@/lib/graphql/types/v2/graphql';

import Avatar from '../../Avatar';
import { Badge } from '../../ui/Badge';
import { Highlight } from '../Highlight';
import { getHighlightsFields } from '../lib';
import type { SearchHighlights } from '../types';

export function AccountResult({
  account,
  highlights,
}: {
  account: SearchAccountFieldsFragment;
  highlights?: SearchHighlights;
}) {
  const intl = useIntl();
  const highlightFields = getHighlightsFields(highlights, ['name', 'slug']);
  const otherHighlight = Object.values(highlightFields.others)[0]?.[0];

  return (
    <div className="flex w-full items-center gap-2">
      <Avatar collective={account} size={36} />

      <div className="flex-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <Highlight content={highlightFields.top.name?.[0] ?? account.name} className="block truncate font-medium" />

          <Badge type="outline" size="xs" className="flex-shrink-0">
            {formatCollectiveType(intl, account.type)}
          </Badge>
        </div>
        <div className="mt-1 truncate text-muted-foreground">
          @<Highlight content={highlightFields.top.slug?.[0] ?? account.slug} />
          {otherHighlight && (
            <React.Fragment>
              {' · '}
              <Highlight className="italic" content={otherHighlight} />
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
}
