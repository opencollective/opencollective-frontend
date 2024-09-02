import React from 'react';
import ProfileLayout from '../../../../components/crowdfunding-redesign/ProfileLayout';
import { ProfileAccounts } from '../../../../components/crowdfunding-redesign/Accounts';
import { useRouter } from 'next/router';
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
        <ProfileAccounts />
      </div>
    </ProfileLayout>
  );
}
