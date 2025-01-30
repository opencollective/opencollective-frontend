import React from 'react';
import { useQuery } from '@apollo/client';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import Link from '../Link';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import { Button } from '../ui/Button';

import { FundraiserStats } from './FundraiserStats';
import { GoalProgress } from './GoalProgress';
import { getDefaultFundraiserValues, getYouTubeIDFromUrl, triggerPrototypeToast } from './helpers';
import ProfileLayout from './ProfileLayout';
import { profilePageQuery } from './queries';
import { TabsList, TabsTrigger } from './Tabs';
import { ThemeColor } from './ThemeColor';

export function FundraiserLayout({ children, activeTab }) {
  const router = useRouter();
  const { data, error, loading } = useQuery(profilePageQuery, {
    variables: { slug: router.query.accountSlug },
    context: API_V2_CONTEXT,
  });
  const account = data?.account;
  const fundraiser = getDefaultFundraiserValues(account);
  const tabRef = React.useRef();

  if (loading || !account) {
    return null;
  }
  const mainAccount = account.parent || account;
  const baseRoute = `/preview/${router.query.collectiveSlug}/${account.type === 'EVENT' ? 'events' : 'projects'}/${account.slug}`;
  if (error) {
    return (
      <div>
        <MessageBoxGraphqlError error={error} />
      </div>
    );
  }

  return (
    <ProfileLayout
      collapsed
      getBreadcrumbs={({ account }) => [
        {
          href: `/preview/${router.query.collectiveSlug}/${account?.type === 'EVENT' ? 'events' : 'projects'}`,
          label: account?.type === 'EVENT' ? 'Events' : 'Projects',
        },
        { label: account?.name },
      ]}
    >
      <div className="flex min-h-screen flex-col justify-between bg-primary-foreground/75 antialiased">
        <div className="flex flex-1 flex-col">
          <React.Fragment>
            <div className="">
              <div className="mx-auto max-w-(--breakpoint-xl) space-y-8 px-6 py-12">
                <div className="space-y-4 text-center">
                  <h1 className="text-4xl font-semibold text-balance">{fundraiser.name}</h1>
                  <p className="text-lg">{fundraiser.description}</p>
                </div>

                <div className="flex grow gap-8">
                  {/* main */}
                  <div className="w-full max-w-[900px] grow space-y-4">
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-primary/20">
                      {fundraiser.cover?.type === 'IMAGE' ? (
                        <img alt="" src={fundraiser.cover.url} className="h-full w-full object-cover" />
                      ) : fundraiser.cover?.type === 'VIDEO' ? (
                        <div className="h-full w-full">
                          <LiteYouTubeEmbed
                            id={getYouTubeIDFromUrl(fundraiser.cover.videoUrl)}
                            title={`Cover Video for ${fundraiser.name}`}
                          />
                        </div>
                      ) : null}
                    </div>

                    <p>
                      {account.type === 'EVENT' ? 'Event' : 'Project'} by{' '}
                      <Link
                        className="font-semibold text-primary hover:underline"
                        href={`/preview/${mainAccount.slug}`}
                      >
                        {mainAccount.name} <ArrowRight className="inline align-middle" size={16} />
                      </Link>
                    </p>
                  </div>

                  {/* sidebar */}
                  <div className="w-full max-w-[420px] space-y-6">
                    {fundraiser.goal ? (
                      <GoalProgress accountSlug={account.slug} goal={fundraiser.goal} />
                    ) : (
                      <FundraiserStats account={account} />
                    )}

                    <Button className="w-full" size="xl" onClick={triggerPrototypeToast}>
                      <FormattedMessage defaultMessage="Contribute" id="Contribute" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky top-0 z-10 border-t border-b bg-background" ref={tabRef}>
              <div className="relative mx-auto -mb-px h-16 max-w-(--breakpoint-xl) px-6">
                <TabsList centered={false}>
                  <TabsTrigger href={baseRoute} active={activeTab === 'fundraiser'}>
                    Fundraiser
                  </TabsTrigger>
                  <TabsTrigger href={`${baseRoute}/finances`} active={activeTab === 'finances'}>
                    Finances
                  </TabsTrigger>
                  <TabsTrigger
                    href={`${baseRoute}/updates`}
                    active={activeTab === 'updates'}
                    count={account.updates?.totalCount}
                  >
                    Updates
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
            <div className="flex-1">{children}</div>

            <ThemeColor color={fundraiser.primaryColor} />
          </React.Fragment>
        </div>
      </div>
    </ProfileLayout>
  );
}
