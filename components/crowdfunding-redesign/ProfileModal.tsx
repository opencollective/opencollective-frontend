import React from 'react';
import { ArrowRight } from 'lucide-react';

import type { Account } from '../../lib/graphql/types/v2/graphql';

import Avatar from '../Avatar';
import Link from '../Link';
import type { BaseModalProps } from '../ModalContext';
import { Button } from '../ui/Button';
import { Dialog, DialogContent } from '../ui/Dialog';

import { getDefaultProfileValues } from './helpers';
import SocialLinks from './SocialLinks';

export function ProfileModal({ account, ...props }: { account: Account } & BaseModalProps) {
  const profile = getDefaultProfileValues(account);
  const hasSocialLinks = account.socialLinks && account.socialLinks.length > 0;

  return (
    <Dialog {...props} onOpenChange={props.setOpen}>
      <DialogContent className="overflow-hidden p-0">
        <div className="relative h-36 w-full bg-primary/20">
          {profile.cover?.url && <img src={profile.cover.url} alt="" className="h-full w-full object-cover" />}
        </div>

        <div className="relative pb-6">
          <div className="mx-auto flex max-w-screen-xl flex-col items-center justify-center gap-2">
            <div className="z-10 -mt-16 mb-2">
              <Avatar className="border-8 border-white bg-white shadow-sm" collective={account} radius={96} />
            </div>
            <div className="space-y-3 p-3 text-center">
              <h1 className="text-balance text-3xl font-semibold">{profile.name}</h1>
              <p className="text-balance text-sm">{profile.description}</p>
              {hasSocialLinks && <SocialLinks socialLinks={account.socialLinks} />}
            </div>
            <Button variant="outline" asChild>
              <Link href={`/preview/${account.slug}`} onClick={() => props.setOpen(false)}>
                Go to profile <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
