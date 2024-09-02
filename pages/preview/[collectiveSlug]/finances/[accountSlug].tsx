import React from 'react';
import { useRouter } from 'next/router';

import { AccountFinances } from '../../../../components/crowdfunding-redesign/AccountFinances';
import ProfileLayout from '../../../../components/crowdfunding-redesign/ProfileLayout';

// next.js export
// ts-unused-exports:disable-next-line
export default function AccountTransactions() {
  const router = useRouter();
  return (
    <ProfileLayout
      collapsed
      getBreadcrumbs={({ account }) => [
        { href: `/preview/${router.query.collectiveSlug}/finances`, label: 'Finances' },
        { href: `/preview/${router.query.collectiveSlug}/finances/${account?.slug}`, label: account?.name },
      ]}
    >
      <div className="flex-1">
        <AccountFinances />
      </div>
    </ProfileLayout>
  );
}
