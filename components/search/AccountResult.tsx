import React from 'react';
import { Markup } from 'interweave';
import { useIntl } from 'react-intl';

import formatCollectiveType from '../../lib/i18n/collective-type';

import Avatar from '../Avatar';
import { Badge } from '../ui/Badge';

import { getHighlightsFields } from './lib';
import type { SearchHighlights } from './types';
import type { AccountResultData } from './useRecentlyVisited';

export function AccountResult({ account, highlights }: { account: AccountResultData; highlights?: SearchHighlights }) {
  const intl = useIntl();
  const highlightFields = getHighlightsFields(highlights, ['name', 'slug']);
  const otherHighlight = Object.values(highlightFields.others)[0]?.[0];
  return (
    <div className="flex w-full items-center gap-2">
      <Avatar collective={account} size={36} />

      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate font-medium">
            {highlightFields.top.name ? (
              <Markup allowList={['mark']} content={highlightFields.top.name[0]} />
            ) : (
              account.name
            )}
          </div>
          <Badge type="outline" size="xs">
            {formatCollectiveType(intl, account.type)}
          </Badge>
        </div>
        <div className="truncate text-muted-foreground">
          @
          {highlightFields.top.slug ? (
            <Markup allowList={['mark']} content={highlightFields.top.slug[0]} />
          ) : (
            account.slug
          )}
          {otherHighlight && (
            <React.Fragment>
              {' · '}
              <Markup allowList={['mark']} className="italic" content={otherHighlight} />
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
}
