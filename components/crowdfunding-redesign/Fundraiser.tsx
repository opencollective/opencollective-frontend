import React from 'react';
import { getApplicableTaxes } from '@opencollective/taxes';
import { cva } from 'class-variance-authority';
import { Markup } from 'interweave';
import { ArrowLeft, ArrowRight } from 'lucide-react';
// eslint-disable-next-line no-restricted-imports
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';

import { getPrecisionFromAmount, graphqlAmountValueInCents } from '../../lib/currency-utils';
import { isPastEvent } from '../../lib/events';
import { TierFrequency } from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { isTierExpired } from '../../lib/tier-utils';

import Avatar, { StackedAvatars } from '../Avatar';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { useModal } from '../ModalContext';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';

import { SingleUpdate } from './updates/SingleUpdate';
import { UpdatesList } from './updates/UpdatesList';
import { ContributionsList } from './ContributionsList';
import ExpensesList from './ExpensesList';
import {
  aggregateGoalAmounts,
  getDefaultFundraiserValues,
  getYouTubeIDFromUrl,
  triggerPrototypeToast,
} from './helpers';
import { ProfileModal } from './ProfileModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import { ThemeColor } from './ThemeColor';

const canContribute = (collective, LoggedInUser) => {
  if (!collective.isActive) {
    return false;
  } else if (collective.type === 'EVENT') {
    return !isPastEvent(collective) || Boolean(LoggedInUser.isAdminOfCollectiveOrHost(collective));
  } else {
    return true;
  }
};

const Tiers = ({ account }) => {
  const LoggedInUser = useLoggedInUser();

  return (
    <div className="space-y-4">
      {account.tiers.nodes.map(tier => {
        const isFlexibleAmount = tier.amountType === 'FLEXIBLE';
        const minAmount = isFlexibleAmount ? tier.minimumAmount : tier.amount;
        const tierIsExpired = isTierExpired(tier);
        const canContributeToCollective = canContribute(account, LoggedInUser);
        const hasNoneLeft = tier.availableQuantity === 0;
        const currency = tier.currency || account.currency;
        const isDisabled = !canContributeToCollective || tierIsExpired || hasNoneLeft;
        const taxes = getApplicableTaxes(account, account.host, tier.type);

        return (
          <div key={tier.id} className="space-y-2 rounded-lg border p-4">
            <div className="text-balance text-lg font-semibold">{tier.name}</div>
            <div className="text-sm">{tier.description}</div>
            {!isDisabled && graphqlAmountValueInCents(minAmount) > 0 && (
              <div className="mt-3 text-muted-foreground">
                {isFlexibleAmount && (
                  <span className="block text-sm">
                    <FormattedMessage id="ContributeTier.StartsAt" defaultMessage="Starts at" />
                  </span>
                )}

                <div className="flex min-h-[36px] flex-col">
                  <span data-cy="amount">
                    <FormattedMoneyAmount
                      amount={graphqlAmountValueInCents(minAmount)}
                      frequency={tier.frequency && tier.frequency !== TierFrequency.FLEXIBLE ? tier.frequency : null}
                      currency={currency}
                      amountClassName="text-foreground font-bold text-2xl"
                      precision={getPrecisionFromAmount(graphqlAmountValueInCents(minAmount))}
                    />
                    {taxes.length > 0 && ' *'}
                  </span>
                  {taxes.length > 0 && (
                    <span className="text-xs">
                      *{' '}
                      {taxes.length > 1 ? (
                        <FormattedMessage id="ContributeTier.Taxes" defaultMessage="Taxes may apply" />
                      ) : (
                        <FormattedMessage
                          defaultMessage="{taxName} may apply"
                          id="N9TNT7"
                          values={{ taxName: taxes[0].type }}
                        />
                      )}
                    </span>
                  )}
                </div>
              </div>
            )}
            <Button onClick={triggerPrototypeToast}>
              {tier.button || <FormattedMessage defaultMessage="Contribute" id="Contribute" />}
            </Button>
          </div>
        );
      })}
    </div>
  );
};

// Naive implementation of Goals for prototype
const Goals = ({ account }) => {
  const {
    stats,
    financialContributors,
    currency,
    settings: { goals },
  } = account;
  const hasYearlyGoal = goals?.find(g => g.type === 'yearlyBudget');
  const hasMonthlyGoal = goals?.find(g => g.type === 'monthlyBudget');
  const currentAmount = hasYearlyGoal
    ? stats.yearlyBudget.valueInCents
    : hasMonthlyGoal
      ? stats.yearlyBudget.valueInCents / 12
      : stats.totalAmountReceived.valueInCents;

  let goalTarget;
  if (hasYearlyGoal || hasMonthlyGoal) {
    goalTarget = aggregateGoalAmounts(goals);
  }
  const percentage = Math.round(goalTarget ? (currentAmount / goalTarget.amount) * 100 : 0);
  return (
    <div className="flex flex-col gap-4 text-muted-foreground">
      {goalTarget && <Progress value={percentage} />}
      <div>
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            {goalTarget ? (
              <span className="text-3xl font-bold text-primary">{percentage}%</span>
            ) : (
              <div>
                <span className="text-3xl font-bold text-primary">
                  <FormattedMoneyAmount
                    amount={currentAmount}
                    currency={currency}
                    showCurrencyCode={true}
                    precision={0}
                  />
                </span>
                <div className="">raised</div>
              </div>
            )}
          </div>
        </div>
        {goalTarget && (
          <div className="">
            towards{' '}
            <FormattedMoneyAmount
              amount={goalTarget.amount}
              currency={currency}
              showCurrencyCode={false}
              precision={0}
            />{' '}
            {hasYearlyGoal ? <span>per year</span> : hasMonthlyGoal && <span>per month</span>} goal
          </div>
        )}
      </div>
      <div>
        <div className="text-3xl font-bold">{stats.contributorsCount}</div> <div>contributors</div>
      </div>
      <div>
        <StackedAvatars imageSize={32} accounts={financialContributors.nodes} maxDisplayedAvatars={6} />
      </div>
    </div>
  );
};

const ContentOverview = ({ content }) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const headings = doc.querySelectorAll('h3');
  const headingTexts = Array.from(headings).map(h3 => h3.textContent?.trim() || '');
  const linkClasses = cva('px-2 font-semibold block hover:text-primary text-sm border-l-[3px]', {
    variants: {
      active: {
        true: 'border-primary/70',
        false: 'border-transparent',
      },
    },
    defaultVariants: {
      active: false,
    },
  });

  return (
    <div className="space-y-4">
      <Link href="#" className={linkClasses({ active: true })}>
        About
      </Link>
      {headingTexts.map(heading => (
        <Link href="#" key={heading} className={linkClasses()} onClick={triggerPrototypeToast}>
          {heading}
        </Link>
      ))}
    </div>
  );
};

export default function Fundraiser({ account }) {
  const fundraiser = getDefaultFundraiserValues(account);
  const mainAccount = account.parent || account;
  const router = useRouter();
  const tabRef = React.useRef();
  const { showModal } = useModal();

  return (
    <React.Fragment>
      <div className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-6">
          <Link href={`/preview/${account.parent?.slug || account.slug}`}>
            <Avatar className="" collective={account.parent || account} />
          </Link>
        </div>
      </div>
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
      <Tabs
        defaultValue="fundraiser"
        value={router.query.path?.[0] || 'fundraiser'}
        onValueChange={slug =>
          router.push(`/preview/${account.slug}/support${slug !== 'fundraiser' ? `/${slug}` : ''}`, undefined, {
            shallow: true,
          })
        }
      >
        <div className="sticky top-0 z-10 border-b border-t bg-background" ref={tabRef}>
          <div className="relative mx-auto -mb-px h-16 max-w-screen-xl px-6">
            <TabsList centered={false}>
              <TabsTrigger value="fundraiser">Fundraiser</TabsTrigger>
              <TabsTrigger value="updates" count={account.updates?.totalCount}>
                Updates
              </TabsTrigger>
              <TabsTrigger value="contributions" count={account.contributionTransactions?.totalCount}>
                Contributions
              </TabsTrigger>
              <TabsTrigger value="expenses" count={account.expenses?.totalCount}>
                Expenses
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
        <TabsContent value="fundraiser">
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
        </TabsContent>
        <TabsContent value="updates">
          {router.query.path?.[1] ? (
            <div className="flex-1 bg-background">
              <div className="relative mx-auto flex max-w-[650px] flex-col gap-8 px-6 py-12">
                <div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/preview/${account.slug}/support/updates`} scroll={false}>
                      <ArrowLeft size={16} className="inline" /> All updates
                    </Link>
                  </Button>
                </div>
                <SingleUpdate updateId={router.query.path[1]} />
              </div>
            </div>
          ) : (
            <UpdatesList account={account} fundraiser={fundraiser} tabRef={tabRef} />
          )}
        </TabsContent>
        <TabsContent value="contributions">
          <ContributionsList account={account} />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpensesList account={account} />
        </TabsContent>
      </Tabs>

      <ThemeColor color={fundraiser.primaryColor} />
    </React.Fragment>
  );
}
