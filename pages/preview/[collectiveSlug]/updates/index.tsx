import React from 'react';
import ProfileLayout from '../../../../components/crowdfunding-redesign/ProfileLayout';
import { UpdatesList } from '../../../../components/crowdfunding-redesign/updates/UpdatesList';

export default function Updates() {
  return (
    <ProfileLayout activeTab="updates">
      <UpdatesList />
    </ProfileLayout>
  );
}
