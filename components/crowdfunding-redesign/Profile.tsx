import React from 'react';
import { MoreHorizontal, Share } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import Avatar from '../Avatar';
import Link from '../Link';
import { Button } from '../ui/Button';

import SocialLinks from './SocialLinks';
import { Tabs } from './Tabs';

export default function Profile({ account }) {
  const hasSocialLinks = account.socialLinks && account.socialLinks.length > 0;

  return (
    <div className="">
      <div className="relative h-80 w-full bg-primary/20">
        {account.backgroundImageUrl && (
          <img src={account.backgroundImageUrl} alt="background" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="relative pb-6">
        <div className="mx-auto flex max-w-screen-xl flex-col items-center justify-center gap-2">
          <div className="z-10 -mt-16 mb-2">
            <Avatar className="border-8 border-white bg-white shadow-sm" collective={account} radius={128} />
          </div>
          <div className="space-y-3 text-center">
            <h1 className="text-balance text-3xl font-semibold">{account.name}</h1>
            <p className="text-sm">{account.description}</p>
            {hasSocialLinks && <SocialLinks socialLinks={account.socialLinks} />}
          </div>
        </div>
        <div className="absolute right-4 top-4 flex gap-2">
          <Button className="">
            <FormattedMessage defaultMessage="Contribute" id="Contribute" />
          </Button>

          <Button variant="secondary" size="icon" className="bg-primary/10 hover:bg-primary/20">
            <Share size={16} />
          </Button>
          <Button variant="secondary" size="icon" className="bg-primary/10 hover:bg-primary/20">
            <MoreHorizontal size={16} />
          </Button>
        </div>
      </div>

      <div className="sticky top-0 z-10 border-b">
        <div className="relative mx-auto -mb-px h-16 max-w-screen-xl">
          <Tabs tabs={['Home', 'Expenses', 'About']} centered={true} />
        </div>
      </div>
      <div className="relative mx-auto max-w-[480px] space-y-4 py-12">
        <Link className="flex flex-col gap-1 rounded-md border bg-white p-4" href={`/preview/${account.slug}/support`}>
          <div className="font-semibold">Support {account.name}</div>
          {account.description && <div className="text-sm">{account.description}</div>}
        </Link>
        {account.childrenAccounts?.nodes?.map(child => (
          <Link
            className="flex flex-col gap-1 rounded-md border bg-white p-4"
            key={child.slug}
            href={`/preview/${child.slug}`}
          >
            <div className="font-semibold">{child.name}</div>
            {child.description && <div className="text-sm">{child.description}</div>}
          </Link>
        ))}
      </div>
    </div>
  );
}
