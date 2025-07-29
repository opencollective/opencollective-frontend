import React from 'react';

import { Finances } from '../../../../components/crowdfunding-redesign/finances/Finances';
import ProfileLayout from '../../../../components/crowdfunding-redesign/ProfileLayout';

// next.js export
// ts-unused-exports:disable-next-line
export default function FinancesPage() {
  return (
    <ProfileLayout activeTab="finances">
      <Finances />
    </ProfileLayout>
  );
}
