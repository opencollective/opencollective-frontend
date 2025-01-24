import React from 'react';
import { useRouter } from 'next/router';

import { TransactionGroupDetails } from '../../../../../components/crowdfunding-redesign/finances/TransactionGroupDetails';
import ProfileLayout from '../../../../../components/crowdfunding-redesign/ProfileLayout';

// next.js export
// ts-unused-exports:disable-next-line
export default function TransactionDetails() {
  const router = useRouter();
  return (
    <ProfileLayout
      collapsed
      getBreadcrumbs={({ account, collective }) => [
        { href: `/preview/${collective?.slug}/finances`, label: 'Finances' },
        { href: `/preview/${collective?.slug}/finances/${account?.slug}`, label: account?.name },
        { label: `Transaction group ${router.query.groupId.toString().substring(0, 8)}` },
      ]}
    >
      <div className="flex-1">
        <TransactionGroupDetails />
      </div>
    </ProfileLayout>
  );
}
