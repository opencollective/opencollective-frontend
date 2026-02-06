import React from 'react';

import { type FragmentOf, graphql, readFragment } from '@/lib/graphql/tada';

import Avatar, { AvatarFragment } from '../../../Avatar';

// Fragment colocated with the component - defines exactly what data this component needs
// Spreads AvatarFragment to include fields required by Avatar component
export const AccountProfileCardFragment = graphql(
  `
    fragment AccountProfileCardFragment on Account {
      id
      description
      ...AvatarFragment
    }
  `,
  [AvatarFragment],
);

type AccountProfileCardProps = {
  account: FragmentOf<typeof AccountProfileCardFragment>;
};

export function AccountProfileCard({ account: accountFragment }: AccountProfileCardProps) {
  // Unmask the fragment data to access the fields
  const account = readFragment(AccountProfileCardFragment, accountFragment);
  // Unmask the nested AvatarFragment for Avatar component
  const avatarData = readFragment(AvatarFragment, account);

  return (
    <div className="flex items-center gap-3 rounded-lg bg-card p-4">
      <Avatar collective={avatarData} radius={48} />
      <div>
        <h3 className="font-semibold text-foreground">{avatarData.name}</h3>
        {account.description && <p className="text-sm text-muted-foreground">{account.description}</p>}
      </div>
    </div>
  );
}
