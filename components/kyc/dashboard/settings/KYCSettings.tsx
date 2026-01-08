import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import type { DashboardSectionProps } from '@/components/dashboard/types';
import { DocumentationCardList } from '@/components/documentation/DocumentationCardList';
import { Skeleton } from '@/components/ui/Skeleton';

import { PersonaSettingsForm } from './PersonaSettingsForm';

export function KYCSettings(props: DashboardSectionProps) {
  const query = useQuery(
    gql`
      query KYCSettings($slug: String, $id: String) {
        account(slug: $slug, id: $id) {
          personaConnectedAccount: connectedAccounts(service: persona) {
            id
            settings
          }
        }
      }
    `,
    {
      variables: {
        slug: props.account.slug,
        id: props.account.id,
      },
    },
  );

  const personaAccount = query.data?.account?.personaConnectedAccount?.[0] ?? {};

  return (
    <div className="flex h-full max-w-screen-lg flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage defaultMessage="KYC Settings" id="jqwUN7" />}
        description={
          <FormattedMessage
            defaultMessage="Connect and configure your Persona integration for automated identity verification."
            id="H0dQi2"
          />
        }
      />

      <div className="mt-4">
        {query.loading ? (
          <Skeleton className="h-[300px]" />
        ) : (
          <PersonaSettingsForm account={props.account} initialValues={personaAccount?.settings ?? {}} />
        )}
      </div>
      <DocumentationCardList
        className="mt-4"
        docs={[
          {
            href: 'https://documentation.opencollective.com/fiscal-hosts/know-your-customer-kyc',
            title: <FormattedMessage defaultMessage="Persona KYC setup" id="1vX2VY" />,
            excerpt: (
              <FormattedMessage
                defaultMessage="Learn how to configure Persona credentials and inquiry templates for your KYC flow."
                id="8bLypT"
              />
            ),
          },
        ]}
      />
    </div>
  );
}
