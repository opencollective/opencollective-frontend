import React from 'react';
import { FundraisingPage } from '../../../../../components/crowdfunding-redesign/FundraisingPage';
import { useRouter } from 'next/router';
import { FundraiserLayout } from '../../../../../components/crowdfunding-redesign/FundraiserLayout';
import { UpdatesList } from '../../../../../components/crowdfunding-redesign/updates/UpdatesList';

export default function EventFundraisingPage() {
  return (
    <FundraiserLayout activeTab="updates">
      <UpdatesList />
    </FundraiserLayout>
  );
}
