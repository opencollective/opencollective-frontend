import React from 'react';
import { Markup } from 'interweave';
import { ChevronRight, MessageSquare, Smile } from 'lucide-react';
// eslint-disable-next-line no-restricted-imports
import Link from 'next/link';
import { FormattedMessage } from 'react-intl';

import { EmptyResults } from '../../dashboard/EmptyResults';
import { Button } from '../../ui/Button';
import { Separator } from '../../ui/Separator';
import { triggerPrototypeToast } from '../helpers';

import { UpdateHeader } from './UpdateHeader';

export function UpdatesList({ account, fundraiser, tabRef }) {
  return (
    <div className="relative mx-auto flex max-w-screen-sm flex-col gap-8 px-6 py-16">
      {account.updates?.totalCount > 0 ? (
        account.updates.nodes.map(update => {
          const numberOfReactions = Object.keys(update.reactions).reduce((acc, emoji) => {
            return acc + update.reactions[emoji];
          }, 0);
          return (
            <Link
              key={update.id}
              href={`/preview/${account.slug}/support/updates/${update.id}`}
              scroll={false}
              shallow={true}
              className="flex cursor-pointer flex-col gap-3 rounded-lg border bg-background p-8 transition-shadow hover:shadow"
              onClick={() => {
                const tabElement = tabRef?.current as HTMLElement | null;
                if (tabElement) {
                  tabElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                }
              }}
            >
              <UpdateHeader update={update} />
              <Separator className="mb-3" />
              {update.userCanSeeUpdate ? (
                <div className="prose prose-slate">
                  <Markup noWrap content={update.summary} allowAttributes />
                </div>
              ) : (
                <div>
                  <FormattedMessage
                    id="update.private.cannot_view_message"
                    defaultMessage="Contribute to {collective} to see this Update"
                    values={{
                      collective: fundraiser.name,
                    }}
                  />
                </div>
              )}
              <div className="flex justify-between gap-4">
                <div className="flex items-center gap-5 text-sm text-muted-foreground">
                  {numberOfReactions > 0 && (
                    <div className="flex items-center gap-2">
                      <Smile size={16} />
                      {numberOfReactions}
                    </div>
                  )}

                  {update.comments?.totalCount > 0 && (
                    <div className="flex items-center gap-2">
                      <MessageSquare size={16} />
                      {update.comments?.totalCount}
                    </div>
                  )}
                </div>
                <Button variant="outline">
                  <FormattedMessage id="ContributeCard.ReadMore" defaultMessage="Read more" />{' '}
                  <ChevronRight size={16} />
                </Button>
              </div>
            </Link>
          );
        })
      ) : (
        <EmptyResults entityType="UPDATES" hasFilters={false} onResetFilters={triggerPrototypeToast} />
      )}
    </div>
  );
}
