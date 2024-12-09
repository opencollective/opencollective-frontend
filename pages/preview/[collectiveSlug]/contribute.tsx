import React from 'react';

import ProfileLayout from '../../../components/crowdfunding-redesign/ProfileLayout';
import MessageBox from '../../../components/MessageBox';

// next.js export
// ts-unused-exports:disable-next-line
export default function ContributionFlow() {
  return (
    <ProfileLayout collapsed getBreadcrumbs={() => [{ label: 'Contribute' }]}>
      <div className="mx-auto max-w-lg">
        <h1>Contribute</h1>
        <MessageBox type="info">Not yet implemented in prototype</MessageBox>
      </div>
    </ProfileLayout>
  );
}
