import React from 'react';
import { FormattedMessage } from 'react-intl';

import Page from '@/components/Page';
import SignupOrgForm from '@/components/signup-org/SignupOrgForm';

// ts-unused-exports:disable-next-line
export default function SignupOrganizationPage() {
  return (
    <Page>
      <div className="mx-auto my-16 max-w-2xl px-2 md:px-3 lg:px-4">
        <h1 className="mb-8 text-2xl font-semibold">
          <FormattedMessage id="organization.create" defaultMessage="Create Organization" />
        </h1>
        <SignupOrgForm />
      </div>
    </Page>
  );
}
