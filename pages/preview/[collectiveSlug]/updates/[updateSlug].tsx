import React from 'react';

import ProfileLayout from '../../../../components/crowdfunding-redesign/ProfileLayout';
import { SingleUpdate } from '../../../../components/crowdfunding-redesign/updates/SingleUpdate';

// next.js export
// ts-unused-exports:disable-next-line
export default function Update() {
  return (
    <ProfileLayout
      collapsed
      getBreadcrumbs={({ collective }) => [
        { href: `/preview/${collective?.slug}/updates`, label: 'Updates' },
        { href: `/preview/${collective?.slug}/updates/${collective?.slug}`, label: collective?.name },
      ]}
    >
      <SingleUpdate />
    </ProfileLayout>
  );
}
