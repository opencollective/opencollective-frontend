import React from 'react';
import { useRouter } from 'next/router';

import ProfileLayout from '../../../../../components/crowdfunding-redesign/ProfileLayout';
import { TransactionGroupDetails } from '../../../../../components/crowdfunding-redesign/TransactionGroupDetails';

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
