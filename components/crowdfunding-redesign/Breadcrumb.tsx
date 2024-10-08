import { useRouter } from 'next/router';
import React from 'react';
import Link from '../Link';
import { Slash } from 'lucide-react';

const getPathdata = (router, collective, account) => {
  switch (router.pathname) {
    case '/preview/[collectiveSlug]/finances/[accountSlug]':
      return [{ href: `/preview/${router.query.collectiveSlug}/finances`, label: 'Finances' }];
    case '/preview/[collectiveSlug]/transactions/[groupId]':
      return [
        { href: `/preview/${router.query.collectiveSlug}/finances`, label: 'Finances' },
        {
          href: `/preview/${router.query.collectiveSlug}/finances/${router.query.collectiveSlug}`,
          label: collective?.name,
        },
      ];
    case '/preview/[collectiveSlug]/[accountSlug]/transactions/[groupId]':
      return [
        { href: `/preview/${router.query.collectiveSlug}/finances`, label: 'Finances' },
        {
          href: `/preview/${router.query.collectiveSlug}/finances/${router.query.accountSlug}`,
          label: account?.name,
        },
      ];
    case '/preview/[collectiveSlug]/projects/[accountSlug]':
      return [{ href: `/preview/${router.query.collectiveSlug}/projects`, label: 'Projects' }];
    case '/preview/[collectiveSlug]/events/[accountSlug]':
      return [{ href: `/preview/${router.query.collectiveSlug}/events`, label: 'Events' }];
    default:
      return [{ href: '', label: '' }];
  }
};

export function Breadcrumb({ breadcrumbs }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <Slash size={20} strokeWidth={1} />

      {breadcrumbs?.map(({ href, label }, i, a) => {
        if (i === a.length - 1) {
          return (
            <span key={href} className="p-1 text-foreground">
              {label}
            </span>
          );
        }
        return (
          <React.Fragment key={href}>
            <Link href={href} className="rounded p-1 hover:bg-muted hover:text-foreground">
              <span className="text-muted-foreground">{label}</span>
            </Link>
            <Slash size={20} strokeWidth={1} />
          </React.Fragment>
        );
      })}
    </div>
  );
}
