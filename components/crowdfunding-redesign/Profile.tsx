import React from 'react';
import { Markup } from 'interweave';
import { MoreHorizontal, Share } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import Avatar from '../Avatar';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import Link from '../Link';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';

import { ContentOverview } from './ContentOverview';
import ExpensesList from './ExpensesList';
import {
  aggregateGoalAmounts,
  getDefaultFundraiserValues,
  getDefaultProfileValues,
  getYouTubeIDFromUrl,
  triggerPrototypeToast,
} from './helpers';
import SocialLinks from './SocialLinks';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import { TabsList, TabsTrigger } from './DumbTabs';

import { ThemeColor } from './ThemeColor';
import { Tiers } from './Tiers';
import { ProfileAccounts } from './Accounts';

export default function Profile({ account }) {
  const hasSocialLinks = account.socialLinks && account.socialLinks.length > 0;
  const profile = getDefaultProfileValues(account);
  const tabRef = React.useRef();
  console.log({ description: account.longDescription });
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

      <div>
        <div className="relative mx-auto -mb-px h-16 max-w-screen-xl px-6">
          <TabsList centered={true}>
            <TabsTrigger href={`/preview/${account.slug}`} value="home">
              Home
            </TabsTrigger>
            <TabsTrigger href={`/preview/${account.slug}/finances`}>Finances</TabsTrigger>
            <TabsTrigger href={`/preview/${account.slug}/updates`}>Updates</TabsTrigger>
            <TabsTrigger href={`/preview/${account.slug}/expenses`} count={account.expenses?.totalCount}>
              Expenses
            </TabsTrigger>
            <TabsTrigger href={`/preview/${account.slug}/expenses`}>About</TabsTrigger>
          </TabsList>
        </div>
      </div>
      {/* <Tabs defaultValue="home">
        <div className="border-b" ref={tabRef}>
          <div className="relative mx-auto -mb-px h-16 max-w-screen-xl px-6">
            <TabsList centered={true}>
              <TabsTrigger value="home">Home</TabsTrigger>
              <TabsTrigger value="accounts">Finances</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
              <TabsTrigger value="expenses" count={account.expenses?.totalCount}>
                Expenses
              </TabsTrigger>
              <TabsTrigger value="About">About</TabsTrigger>
            </TabsList>
          </div>
        </div>
        <TabsContent value="home">
          <div className="flex-1 bg-background">
            <div className="relative mx-auto grid max-w-screen-xl grid-cols-12 gap-8 px-6 py-12">
              <div className="col-span-2">
                <div className="sticky top-28 space-y-4">
                  <ContentOverview content={account.longDescription} />
                </div>
              </div>

              <div className="prose prose-slate col-span-7">
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
              <div className="col-span-3">{account.tiers && <Tiers account={account} />}</div>
            </div>
          </div>
          <div className="relative mx-auto max-w-[512px] space-y-4 px-6 py-12">
            {account.childrenAccounts?.nodes?.map(child => {
              return <FundraiserCard key={child.id} account={child} />;
            })}
          </div>
        </TabsContent>
        <TabsContent value="accounts">
          <div className="flex-1">
            <ProfileAccounts account={account} />
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
                        frameBorder={node.getAttribute('frameborder')}
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
        </TabsContent>
      </Tabs> */}

      <ThemeColor color={profile.primaryColor} />
    </div>
  );
}
