import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import Image from 'next/image';
import { FormattedMessage } from 'react-intl';

import { hasAccountHosting, hasAccountMoneyManagement } from '@/lib/collective';
import { API_V2_CONTEXT, gql } from '@/lib/graphql/helpers';
import { editCollectivePageQuery } from '@/lib/graphql/v1/queries';

import I18nFormatters from '@/components/I18nFormatters';
import { DocumentationLink } from '@/components/Link';

import { useModal } from '../../ModalContext';
import { Button } from '../../ui/Button';

import SettingsSectionTitle from './SettingsSectionTitle';

const editMoneyManagementAndHostingMutation = gql`
  mutation EditMoneyManagementAndHosting(
    $organization: AccountReferenceInput!
    $hasMoneyManagement: Boolean
    $hasHosting: Boolean
  ) {
    editOrganizationMoneyManagementAndHosting(
      organization: $organization
      hasMoneyManagement: $hasMoneyManagement
      hasHosting: $hasHosting
    ) {
      id
      isHost
      hasMoneyManagement
      hasHosting
      settings
    }
  }
`;

const fiscalHostingQuery = gql`
  query FiscalHosting($id: String!) {
    host(id: $id) {
      id
      totalHostedAccounts
    }
  }
`;

const FiscalHosting = ({ collective, account }) => {
  const { showConfirmationModal } = useModal();
  const { data, loading } = useQuery(fiscalHostingQuery, {
    variables: { id: account.id },
    context: API_V2_CONTEXT,
  });

  const hasMoneyManagement = hasAccountMoneyManagement(account);
  const hasHosting = hasAccountHosting(account);

  const totalHostedAccounts = data?.totalHostedAccounts;

  const refetchAdminPanelMutationParams = {
    refetchQueries: [
      {
        query: editCollectivePageQuery,
        variables: {
          slug: collective.slug,
        },
      },
    ],
  };
  const [editMoneyManagementAndHosting] = useMutation(editMoneyManagementAndHostingMutation, {
    ...refetchAdminPanelMutationParams,
    context: API_V2_CONTEXT,
  });

  const handleMoneyManagementUpdate = async ({ activate }) => {
    if (activate) {
      await editMoneyManagementAndHosting({
        variables: { organization: { slug: collective.slug }, hasMoneyManagement: true },
      });
    } else {
      showConfirmationModal({
        title: (
          <FormattedMessage
            id="Advanced.MoneyManagement.Deactivate.Title"
            defaultMessage="Deactivate money management?"
          />
        ),
        description: (
          <div className="flex flex-col text-sm text-foreground">
            <div className="text-sm [&>p]:mt-2">
              {hasHosting && totalHostedAccounts > 0 ? (
                <FormattedMessage
                  values={{
                    totalHostedAccounts,
                    link: chunk => (
                      <DocumentationLink href="https://documentation.opencollective.com/fiscal-hosts/closing-a-fiscal-host">
                        {chunk}
                      </DocumentationLink>
                    ),
                    ...I18nFormatters,
                  }}
                  id="Advanced.FiscalHosting.deactivate.warning"
                  defaultMessage="<p>It is not possible to deactivate your organization as a fiscal host because you are currently hosting {totalHostedAccounts} accounts.</p><p>To deactivate, they need to be moved to a different fiscal host or archived.</p><p>For more information on closing your fiscal host, please <link>read our documentation</link>.</p>"
                />
              ) : (
                <React.Fragment>
                  <FormattedMessage
                    defaultMessage="<p>Deactivating money management functionalities will also remove any existing integration with Stripe, Wise and PayPal.</p><p>After deactivation, you can easily reactivate it at any time.</p>"
                    id="Advanced.MoneyManagement.deactivate.confirmation"
                    values={I18nFormatters}
                  />
                  {hasHosting && (
                    <p>
                      <FormattedMessage
                        id="FiscalHosting.moneyManagement.deactivate.warning"
                        defaultMessage="Deactivating money management will also deactivate fiscal hosting."
                      />
                    </p>
                  )}
                </React.Fragment>
              )}
            </div>
          </div>
        ),
        confirmDisabled: totalHostedAccounts > 0,
        onConfirm: async () => {
          await editMoneyManagementAndHosting({
            variables: { organization: { slug: collective.slug }, hasMoneyManagement: false, hasHosting: false },
          });
        },
        confirmLabel: <FormattedMessage id="Deactivate" defaultMessage="Deactivate" />,
        variant: 'destructive',
      });
    }
  };

  const handleFiscalHostUpdate = async ({ activate }) => {
    if (activate) {
      await editMoneyManagementAndHosting({
        variables: { organization: { slug: collective.slug }, hasHosting: true },
      });
    } else {
      showConfirmationModal({
        title: (
          <FormattedMessage id="Advanced.FiscalHosting.Deactivate.Title" defaultMessage="Deactivate as fiscal host?" />
        ),
        description: (
          <div className="flex flex-col gap-4 text-sm text-foreground [&>p]:mt-2">
            {hasHosting && totalHostedAccounts > 0 ? (
              <FormattedMessage
                values={{
                  totalHostedAccounts,
                  link: chunk => (
                    <DocumentationLink href="https://documentation.opencollective.com/fiscal-hosts/closing-a-fiscal-host">
                      {chunk}
                    </DocumentationLink>
                  ),
                  ...I18nFormatters,
                }}
                id="Advanced.FiscalHosting.deactivate.warning"
                defaultMessage="<p>It is not possible to deactivate your organization as a fiscal host because you are currently hosting {totalHostedAccounts} accounts.</p><p>To deactivate, they need to be moved to a different fiscal host or archived.</p><p>For more information on closing your fiscal host, please <link>read our documentation</link>.</p>"
              />
            ) : (
              <p className="text-sm">
                <FormattedMessage
                  id="Advanced.FiscalHosting.deactivate.confirmation"
                  defaultMessage="Are you sure you want to deactivate this Fiscal Host? After deactivation, you can easily reactivate it at any time."
                />
              </p>
            )}
          </div>
        ),
        confirmDisabled: totalHostedAccounts > 0,
        onConfirm: () => {
          return editMoneyManagementAndHosting({
            variables: { organization: { slug: collective.slug }, hasHosting: false },
          });
        },
        confirmLabel: <FormattedMessage id="Deactivate" defaultMessage="Deactivate" />,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="mb-10 flex w-full flex-col gap-4">
      <p>
        <FormattedMessage defaultMessage="Manage the platform functionalities for your organization" id="lVkMQs" />
      </p>
      <div className="mt-4 flex w-full flex-col gap-4">
        <div>
          <SettingsSectionTitle className="mb-2">
            <FormattedMessage id="FiscalHosting.Functionalities" defaultMessage="Manage Functionalities" />
          </SettingsSectionTitle>
          <p className="text-sm text-gray-700 md:max-w-4/5">
            <FormattedMessage
              id="FiscalHosting.Functionalities.description"
              defaultMessage="Making contributions on the platform or getting paid on behalf of the organization are platform basics, activate additional functionalities to do more on the platform."
            />
          </p>
        </div>
        <div
          className="flex items-center gap-4 rounded-lg border border-border px-6 py-4"
          data-cy="money-management-section"
        >
          <Image src="/static/images/welcome/jar.png" alt="Money Management Icon" width={52} height={49} />
          <div className="grow">
            <h1 className="mb-2 font-bold">
              <FormattedMessage defaultMessage="Money Management" id="Welcome.Organization.MoneyManagement" />
            </h1>
            <p className="text-sm text-gray-700">
              <FormattedMessage
                defaultMessage="Receive and disburse money on the platform along with crowdfunding. Additionally manage funds and grants."
                id="FiscalHosting.moneyManagement.description"
              />
            </p>
          </div>
          <Button
            onClick={() => handleMoneyManagementUpdate({ activate: !hasMoneyManagement })}
            variant={loading || hasMoneyManagement ? 'outlineDestructive' : 'default'}
            className="my-2 w-fit"
            loading={loading}
          >
            {hasMoneyManagement ? (
              <FormattedMessage id="Deactivate" defaultMessage="Deactivate" />
            ) : (
              <FormattedMessage id="Activate" defaultMessage="Activate" />
            )}
          </Button>
        </div>

        <div
          className="flex items-center gap-4 rounded-lg border border-border px-6 py-4"
          data-cy="fiscal-hosting-section"
        >
          <Image src="/static/images/welcome/place.png" alt="Fiscal Host Icon" width={52} height={49} />
          <div className="grow">
            <h1 className="mb-2 font-bold">
              <FormattedMessage defaultMessage="Fiscal Hosting" id="editCollective.fiscalHosting" />
            </h1>
            <p className="text-sm text-gray-700">
              <FormattedMessage
                defaultMessage="Provide fiscal services for collectives and manage funds for grant distribution along with fundraising and paying expenses."
                id="FiscalHosting.fiscalHost.description"
              />
            </p>
          </div>
          <Button
            onClick={() => handleFiscalHostUpdate({ activate: !hasHosting })}
            disabled={!hasMoneyManagement}
            variant={loading || hasHosting ? 'outlineDestructive' : 'default'}
            className="my-2 w-fit"
            loading={loading}
          >
            {hasHosting ? (
              <FormattedMessage id="Deactivate" defaultMessage="Deactivate" />
            ) : (
              <FormattedMessage id="Activate" defaultMessage="Activate" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FiscalHosting;
