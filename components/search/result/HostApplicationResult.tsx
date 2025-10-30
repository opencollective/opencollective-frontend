import React from 'react';
import { Markup } from 'interweave';
import { useIntl } from 'react-intl';

import i18nHostApplicationStatus from '../../../lib/i18n/host-application-status';

import Avatar from '../../Avatar';
import { Badge } from '../../ui/Badge';
import { getHighlightsFields } from '../lib';
import type { SearchHighlights } from '../types';
import type { HostApplicationResultData } from '../useRecentlyVisited';

export function HostApplicationResult({
  hostApplication,
  highlights,
}: {
  hostApplication: HostApplicationResultData;
  highlights?: SearchHighlights;
}) {
  const intl = useIntl();
  const highlightFields = getHighlightsFields(highlights, ['name', 'slug']);
  const otherHighlight = Object.values(highlightFields.others)[0]?.[0];

  return (
    <div className="flex w-full items-center gap-2">
      <Avatar collective={hostApplication.account} size={36} />

      <div className="flex-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="truncate font-medium">
            {highlightFields.top.name ? (
              <Markup allowList={['mark']} content={highlightFields.top.name[0]} />
            ) : (
              hostApplication.account.name
            )}
          </div>
          <Badge type="outline" size="xs">
            {i18nHostApplicationStatus(intl, hostApplication.status)}
          </Badge>
        </div>
        <div className="mt-1 truncate text-muted-foreground">
          @
          {highlightFields.top.slug ? (
            <Markup allowList={['mark']} content={highlightFields.top.slug[0]} />
          ) : (
            hostApplication.account.slug
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
