import React from 'react';
import { Markup } from 'interweave';
import { merge, pick } from 'lodash';
import { MoreHorizontal, Share } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import Avatar from '../Avatar';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import Link from '../Link';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';

import ExpensesList from './ExpensesList';
import {
  aggregateGoalAmounts,
  getDefaultFundraiserValues,
  getDefaultProfileValues,
  getYouTubeIDFromUrl,
  triggerPrototypeToast,
} from './helpers';
import SocialLinks from './SocialLinks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import { ThemeColor } from './ThemeColor';

function FundraiserCard({ account, isRoot = false }) {
  const fundraiser = getDefaultFundraiserValues(account);
  const {
    stats,
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
    <Link
      className="flex flex-col gap-1 overflow-hidden rounded-md border bg-white"
      key={account.slug}
      href={isRoot ? `/preview/${account.slug}/support` : `/preview/${account.slug}`}
    >
      {fundraiser.cover?.type === 'IMAGE' && fundraiser.cover.url ? (
        <img src={fundraiser.cover.url} alt="" className="-mb-2 aspect-video h-full w-full object-cover" />
      ) : fundraiser.cover?.type === 'VIDEO' ? (
        <img
          src={`https://i.ytimg.com/vi/${getYouTubeIDFromUrl(fundraiser.cover.videoUrl)}/maxresdefault.jpg`}
          alt=""
          className="-mb-2 aspect-video h-full w-full object-cover"
        />
      ) : null}
      <div className="flex flex-col gap-1 p-4">
        <div className="text-lg font-semibold">{fundraiser.name}</div>
        {fundraiser.description && <div className="text-sm">{fundraiser.description}</div>}
        <div>
          <div className="flex flex-col gap-4 text-muted-foreground">
            {goalTarget && <Progress value={percentage} />}
            <div>
              <div className="flex items-end justify-between gap-4">
                <div className="flex items-end gap-4">
                  {goalTarget ? (
                    <span className="text-3xl font-bold text-primary">{percentage}%</span>
                  ) : (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        <FormattedMoneyAmount
                          amount={currentAmount || 0}
                          currency={currency}
                          showCurrencyCode={false}
                          amountStyles={{ letterSpacing: 0 }}
                          precision={0}
                        />
                        {' raised'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Profile({ account }) {
  const hasSocialLinks = account.socialLinks && account.socialLinks.length > 0;
  const profile = getDefaultProfileValues(account);
  const tabRef = React.useRef();
  return (
    <div className="">
      <div className="relative h-80 w-full bg-primary/20">
        {profile.cover?.url && <img src={profile.cover.url} alt="" className="h-full w-full object-cover" />}
      </div>

      <div className="relative pb-6">
        <div className="mx-auto flex max-w-screen-xl flex-col items-center justify-center gap-2">
          <div className="z-10 -mt-16 mb-2">
            <Avatar className="border-8 border-white bg-white shadow-sm" collective={account} radius={128} />
          </div>
          <div className="space-y-3 text-center">
            <h1 className="text-balance text-3xl font-semibold">{profile.name}</h1>
            <p className="text-sm">{profile.description}</p>
            {hasSocialLinks && <SocialLinks socialLinks={account.socialLinks} />}
          </div>
        </div>
        <div className="absolute right-4 top-4 flex gap-2">
          <Button onClick={triggerPrototypeToast}>
            <FormattedMessage defaultMessage="Contribute" id="Contribute" />
          </Button>

          <Button
            onClick={triggerPrototypeToast}
            variant="secondary"
            size="icon"
            className="bg-primary/10 hover:bg-primary/20"
          >
            <Share size={16} />
          </Button>
          <Button
            onClick={triggerPrototypeToast}
            variant="secondary"
            size="icon"
            className="bg-primary/10 hover:bg-primary/20"
          >
            <MoreHorizontal size={16} />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="home">
        <div className="border-b" ref={tabRef}>
          <div className="relative mx-auto -mb-px h-16 max-w-screen-xl px-6">
            <TabsList centered={true}>
              <TabsTrigger value="home">Home</TabsTrigger>

              <TabsTrigger value="expenses" count={account.expenses?.totalCount}>
                Expenses
              </TabsTrigger>
              <TabsTrigger value="About">About</TabsTrigger>
            </TabsList>
          </div>
        </div>
        <TabsContent value="home">
          <div className="relative mx-auto max-w-[512px] space-y-4 px-6 py-12">
            <FundraiserCard account={account} isRoot />
            {account.childrenAccounts?.nodes?.map(child => {
              return <FundraiserCard key={child.id} account={child} />;
            })}
          </div>
        </TabsContent>
        <TabsContent value="expenses">
          <ExpensesList account={account} />
        </TabsContent>
        <TabsContent value="About">
          <div className="prose prose-slate col-span-7 mx-auto py-12">
            <Markup
              noWrap
              content={profile.longDescription ?? ''}
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
        </TabsContent>
      </Tabs>

      <ThemeColor color={profile.primaryColor} />
    </div>
  );
}
