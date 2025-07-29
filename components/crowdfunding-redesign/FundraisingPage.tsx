import React from 'react';
import { useQuery } from '@apollo/client';
import { Markup } from 'interweave';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import MessageBoxGraphqlError from '../MessageBoxGraphqlError';

import { ContentOverview } from './ContentOverview';
import { getDefaultFundraiserValues } from './helpers';
import { profilePageQuery } from './queries';
import { Tiers } from './Tiers';

export function FundraisingPage() {
  const router = useRouter();
  const { data, error, loading } = useQuery(profilePageQuery, {
    variables: { slug: router.query.accountSlug },
    context: API_V2_CONTEXT,
  });
  const account = data?.account;
  const fundraiser = getDefaultFundraiserValues(account);

  if (loading || !account) {
    return null;
  }
  if (error) {
    return (
      <div>
        <MessageBoxGraphqlError error={error} />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background">
      <div className="relative mx-auto grid max-w-(--breakpoint-xl) grid-cols-12 gap-8 px-6 py-12">
        <div className="col-span-2">
          <div className="sticky top-28 space-y-4">
            <ContentOverview content={fundraiser.longDescription} />
          </div>
        </div>

        <div className="col-span-7 prose prose-slate">
          <h2>
            <FormattedMessage defaultMessage="About" id="collective.about.title" />
          </h2>
          <Markup
            noWrap
            content={fundraiser.longDescription ?? ''}
            allowAttributes
            transform={node => {
              // Allow some iframes
              if (node.tagName.toLowerCase() === 'iframe') {
                const src = node.getAttribute('src');
                const parsedUrl = new URL(src);
                const hostname = parsedUrl.hostname;
                if (['youtube-nocookie.com', 'www.youtube-nocookie.com', 'anchor.fm'].includes(hostname)) {
                  return (
                    <iframe
                      width={node.getAttribute('width')}
                      height={node.getAttribute('height')}
                      allowFullScreen={node.getAttribute('allowfullscreen') as any}
                      title={node.getAttribute('title') || 'Embed content'}
                      src={src}
                    />
                  );
                }
              } else if (node.tagName.toLowerCase() === 'a') {
                // Open links in new tab
                node.setAttribute('target', '_blank');
                node.setAttribute('rel', 'noopener noreferrer');
              }
            }}
          />
        </div>
        <div className="col-span-3">{account.tiers && <Tiers account={account} />}</div>
      </div>
    </div>
  );
}
