import React from 'react';
import { useIntl } from 'react-intl';

import i18nHostApplicationStatus from '../../../lib/i18n/host-application-status';
import type { SearchHostApplicationFieldsFragment } from '@/lib/graphql/types/v2/graphql';

import Avatar from '../../Avatar';
import { Badge } from '../../ui/Badge';
import { Highlight } from '../Highlight';
import { getHighlightsFields } from '../lib';
import type { SearchHighlights } from '../types';

export function HostApplicationResult({
  hostApplication,
  highlights,
}: {
  hostApplication: SearchHostApplicationFieldsFragment;
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
              <Highlight content={highlightFields.top.name[0]} />
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
            <Highlight content={highlightFields.top.slug[0]} />
          ) : (
            hostApplication.account.slug
          )}
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
