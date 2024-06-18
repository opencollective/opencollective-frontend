import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import Page from '../Page';

import { Banner } from './Banner';
import { Footer } from './Footer';
import Fundraiser from './Fundraiser';
import Profile from './Profile';
import { profilePageQuery } from './queries';

export function CrowdfundingPrototypePage({ isFundraiser }: { isFundraiser?: boolean }) {
  const router = useRouter();

  const { data, error, loading } = useQuery(profilePageQuery, {
    variables: { slug: router.query.accountSlug },
    context: API_V2_CONTEXT,
  });
  const account = data?.account;

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

  const isProjectOrEvent = ['EVENT', 'PROJECT'].includes(account.type);

  return (
    <Page withTopBar={false} showFooter={false} title={`[PREVIEW] ${account.name} | Open Collective`}>
      <div className="flex min-h-screen flex-col justify-between bg-primary/5 antialiased">
        <div className="flex flex-1 flex-col">
          <Banner account={account} isFundraiser={isFundraiser || isProjectOrEvent} />
          {isFundraiser || isProjectOrEvent ? <Fundraiser account={account} /> : <Profile account={account} />}
        </div>

        <Footer account={account} />
      </div>
    </Page>
  );
}
