import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import Page from '../Page';

import { Banner } from './Banner';
import { Footer } from './Footer';
import Fundraiser from './Fundraiser';
import { profilePageQuery } from './queries';
import {
  aggregateGoalAmounts,
  getDefaultFundraiserValues,
  getYouTubeIDFromUrl,
  triggerPrototypeToast,
} from './helpers';
import { useModal } from '../ModalContext';
import Link from '../Link';
import { ProfileModal } from './ProfileModal';
import { ArrowRight } from 'lucide-react';
import { Progress } from '../ui/Progress';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { StackedAvatars } from '../Avatar';
import { Button } from '../ui/Button';
import { FormattedMessage } from 'react-intl';
import { TabsList, TabsTrigger } from './DumbTabs';
import { ThemeColor } from './ThemeColor';
import ProfileLayout from './ProfileLayout';
import { Goals } from './Goals';

export function FundraiserLayout({ children, activeTab }) {
  const router = useRouter();
  const { data, error, loading } = useQuery(profilePageQuery, {
    variables: { slug: router.query.accountSlug },
    context: API_V2_CONTEXT,
  });
  const account = data?.account;
  const fundraiser = getDefaultFundraiserValues(account);
  const tabRef = React.useRef();
  const { showModal } = useModal();

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
          {/* <Banner account={account} isFundraiser={true} /> */}
          <React.Fragment>
            {/* <div className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-6">
          <Link href={`/preview/${account.parent?.slug || account.slug}`}>
            <Avatar className="" collective={account.parent || account} />
          </Link>
        </div>
      </div> */}
            <div className="">
              <div className="mx-auto max-w-screen-xl space-y-8 px-6 py-12">
                <div className="space-y-4 text-center">
                  <h1 className="text-balance text-4xl font-semibold">{fundraiser.name}</h1>
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
                      {account.type === 'EVENT' ? 'Event' : 'Fundraiser'} by{' '}
                      <Link
                        className="font-semibold text-primary hover:underline"
                        href={`/preview/${mainAccount.slug}`}
                        onClick={e => {
                          e.preventDefault();
                          showModal(ProfileModal, { account: mainAccount });
                        }}
                      >
                        {mainAccount.name} <ArrowRight className="inline align-middle" size={16} />
                      </Link>
                    </p>
                  </div>

                  {/* sidebar */}
                  <div className="w-full max-w-[420px] space-y-4">
                    <Goals account={account} />

                    <Button className="w-full" size="xl" onClick={triggerPrototypeToast}>
                      <FormattedMessage defaultMessage="Contribute" id="Contribute" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky top-0 z-10 border-b border-t bg-background" ref={tabRef}>
              <div className="relative mx-auto -mb-px h-16 max-w-screen-xl px-6">
                <TabsList centered={false}>
                  <TabsTrigger href={baseRoute} value="fundraiser" activeTab={activeTab}>
                    Fundraiser
                  </TabsTrigger>
                  <TabsTrigger
                    href={`${baseRoute}/updates`}
                    value="updates"
                    activeTab={activeTab}
                    count={account.updates?.totalCount}
                  >
                    Updates
                  </TabsTrigger>
                  <TabsTrigger
                    href={`${baseRoute}/contributions`}
                    value="contributions"
                    activeTab={activeTab}
                    count={account.contributionTransactions?.totalCount}
                  >
                    Contributions
                  </TabsTrigger>
                  <TabsTrigger
                    href={`${baseRoute}/expenses`}
                    value="expenses"
                    activeTab={activeTab}
                    count={account.expenses?.totalCount}
                  >
                    Expenses
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
            {children}

            <ThemeColor color={fundraiser.primaryColor} />
          </React.Fragment>
        </div>
      </div>
    </ProfileLayout>
  );
}
