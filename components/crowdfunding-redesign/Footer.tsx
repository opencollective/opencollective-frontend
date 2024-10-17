import React from 'react';

import Avatar from '../Avatar';
import Link from '../Link';
import { Separator } from '../ui/Separator';

export const Footer = ({ account }) => {
  const mainAccount = account.parent ?? account;
  return (
    <footer className="border-t px-6 py-12">
      <div className="mx-auto max-w-screen-xl space-y-8">
        <div className="flex justify-between text-sm">
          <Link href={`/preview/${mainAccount.slug}`} className="flex items-center gap-2">
            <Avatar className="border-2 border-white bg-white shadow-sm" radius={28} collective={mainAccount} />{' '}
            <span className="">{mainAccount.name}</span>
          </Link>
          {account.host && account.host.slug !== mainAccount.slug && (
            <div className="flex flex-col items-end gap-1 text-right text-sm">
              <span className="text-muted-foreground">{mainAccount.name} is fiscally hosted by</span>
              <div className="inline-flex items-center gap-2 align-middle">
                <Avatar className="border-2 border-white bg-white shadow-sm" radius={28} collective={account.host} />{' '}
                <span>{account.host.name}</span>
              </div>
            </div>
          )}
        </div>

        <Separator />
        <div className="flex justify-between">
          <Link href="/" className="flex items-center gap-1">
            <span className="text-xs font-semibold">Powered by</span>
            <img className="h-5" src="/static/images/logotype.svg" alt="Open Collective" />
          </Link>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <Link className="hover:text-foreground" href="/help">
              Help & Support
            </Link>
            <Link className="hover:text-foreground" href="/privacypolicy">
              Privacy
            </Link>
            <Link className="hover:text-foreground" href="/tos">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
