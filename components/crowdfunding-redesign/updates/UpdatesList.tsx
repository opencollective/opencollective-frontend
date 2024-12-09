import React from 'react';
import { useQuery } from '@apollo/client';
import { Markup } from 'interweave';
import { ChevronRight, MessageSquare, Smile } from 'lucide-react';
// eslint-disable-next-line no-restricted-imports
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';

import { EmptyResults } from '../../dashboard/EmptyResults';
import { Button } from '../../ui/Button';
import { Separator } from '../../ui/Separator';
import { triggerPrototypeToast } from '../helpers';
import { updatesQuery } from '../queries';

import { UpdateHeader } from './UpdateHeader';

export function UpdatesList() {
  const router = useRouter();
  const { data } = useQuery(updatesQuery, {
    variables: { slug: router.query.accountSlug ?? router.query.collectiveSlug },
    context: API_V2_CONTEXT,
  });
  const account = data?.account;
  return (
    <div className="relative mx-auto flex max-w-screen-sm flex-col gap-8 px-6 py-16">
      {data?.account.updates?.totalCount > 0 ? (
        account.updates.nodes.map(update => {
          const numberOfReactions = Object.keys(update.reactions).reduce((acc, emoji) => {
            return acc + update.reactions[emoji];
          }, 0);
          return (
            <Link
              key={update.id}
              href={`/preview/${router.query.collectiveSlug}/updates/${update.id}`}
              className="flex cursor-pointer flex-col gap-3 rounded-lg border bg-background p-8 transition-shadow hover:shadow"
              // TODO: Consider smooth scrolling to content when opening an update if using expanded fundraiser layout
              // onClick={() => {
              //   const tabElement = tabRef?.current as HTMLElement | null;
              //   if (tabElement) {
              //     tabElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
              //   }
              // }}
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
                      collective: account.name,
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
