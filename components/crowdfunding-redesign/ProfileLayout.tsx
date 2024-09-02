import React from 'react';

import { getDefaultProfileValues } from './helpers';

import { ThemeColor } from './ThemeColor';
import { profileWrapperQuery } from './queries';
import { useQuery } from '@apollo/client';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { useRouter } from 'next/router';
import { Footer } from './Footer';
import Page from '../Page';
import { AnimatePresence } from 'framer-motion';
import { Header } from './Header';
import { Banner } from './Banner';

export default function ProfileLayout({ activeTab = 'home', children, collapsed = false, getBreadcrumbs = undefined }) {
  const router = useRouter();
  const { data, loading, variables, error } = useQuery(profileWrapperQuery, {
    variables: {
      collectiveSlug: router.query.collectiveSlug,
      accountSlug: router.query.accountSlug,
      includeAccount: Boolean(router.query.accountSlug),
    },
    context: API_V2_CONTEXT,
  });
  const breadcrumbs = getBreadcrumbs
    ? getBreadcrumbs({ account: data?.account, collective: data?.collective })
    : undefined;
  const collective = data?.collective;
  const account = data?.account;
  const profile = getDefaultProfileValues(collective);

  return (
    <Page withTopBar={false} showFooter={false} title={`[PREVIEW] ${collective?.name} | Open Collective`}>
      <Banner account={account || collective} isFundraiser={account?.type === 'EVENT' || account?.type === 'PROJECT'} />

      <AnimatePresence mode="wait" initial={false}>
        <div className="flex min-h-screen flex-col justify-between bg-primary-foreground/75 antialiased">
          <Header
            collective={collective}
            account={account}
            activeTab={activeTab}
            profile={profile}
            collapsed={collapsed}
            breadcrumbs={breadcrumbs}
          />

          <div className="z-0 flex flex-1 flex-col">
            <main className="flex-1">{children}</main>
            <ThemeColor color={profile?.primaryColor} />
            <Footer account={collective} />
          </div>
        </div>
      </AnimatePresence>
    </Page>
  );
}
