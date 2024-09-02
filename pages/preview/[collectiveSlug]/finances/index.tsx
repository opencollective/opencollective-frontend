import React from 'react';

import { CollectiveFinances } from '../../../../components/crowdfunding-redesign/CollectiveFinances';
import ProfileLayout from '../../../../components/crowdfunding-redesign/ProfileLayout';

// next.js export
// ts-unused-exports:disable-next-line
export default function Finances() {
  return (
    <ProfileLayout activeTab="finances">
      <CollectiveFinances />
    </ProfileLayout>
  );
}
