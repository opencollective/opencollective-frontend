import React from 'react';
import ProfileLayout from '../../../../components/crowdfunding-redesign/ProfileLayout';
import { UpdatesList } from '../../../../components/crowdfunding-redesign/updates/UpdatesList';
import { SingleUpdate } from '../../../../components/crowdfunding-redesign/updates/SingleUpdate';

export default function Update() {
  return (
    <ProfileLayout
      collapsed
      //   activeTab="updates"
      getBreadcrumbs={({ account, collective }) => [
        { href: `/preview/${collective?.slug}/updates`, label: 'Updates' },
        { href: `/preview/${collective?.slug}/updates/${collective?.slug}`, label: collective?.name },
      ]}
    >
      <SingleUpdate />
    </ProfileLayout>
  );
}
