import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import Page from '../Page';

import { Banner } from './Banner';
import { Footer } from './Footer';
import Fundraiser from './Fundraiser';
import { profilePageQuery } from './queries';
import { ContentOverview } from './ContentOverview';
import { FormattedMessage } from 'react-intl';
import { getDefaultFundraiserValues } from './helpers';
import { Markup } from 'interweave';
import { merge, pick } from 'lodash';
import { Tiers } from './Tiers';
import { Goals } from './Goals';

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
      <div className="relative mx-auto grid max-w-screen-xl grid-cols-12 gap-8 px-6 py-12">
        <div className="col-span-2">
          <div className="sticky top-28 space-y-4">
            <ContentOverview content={fundraiser.longDescription} />
          </div>
        </div>

        <div className="prose prose-slate col-span-7">
          <h2>
            <FormattedMessage defaultMessage="About" id="collective.about.title" />
          </h2>
          <Markup
            noWrap
            content={fundraiser.longDescription ?? ''}
            allowAttributes
            transform={node => {
              // Allow some iframes
              const attrs = [].slice.call(node.attributes);
              if (node.tagName === 'iframe') {
                const src = node.getAttribute('src');
                const parsedUrl = new URL(src);
                const hostname = parsedUrl.hostname;
                if (['youtube-nocookie.com', 'www.youtube-nocookie.com', 'anchor.fm'].includes(hostname)) {
                  const attributes = merge({}, ...attrs.map(({ name, value }) => ({ [name]: value })));
                  return (
                    <iframe
                      {...pick(attributes, ['width', 'height', 'frameborder', 'allowfullscreen'])}
                      title={attributes.title || 'Embed content'}
                      src={src}
                    />
                  );
                }
              } else if (node.tagName === 'a') {
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
