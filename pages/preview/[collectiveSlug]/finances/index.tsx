import React from 'react';
import ProfileLayout from '../../../../components/crowdfunding-redesign/ProfileLayout';
import { ProfileAccounts } from '../../../../components/crowdfunding-redesign/Accounts';
export default function Finances() {
  return (
    <ProfileLayout activeTab="finances">
      <div className="flex-1">
        <ProfileAccounts />
      </div>
    </ProfileLayout>
  );
}
