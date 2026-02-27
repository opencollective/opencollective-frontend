import React from 'react';
import type { InternalRefetchQueriesInclude } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client';
import Image from 'next/image';
import { FormattedMessage } from 'react-intl';

import { hasAccountMoneyManagement } from '@/lib/collective';
import { API_V1_CONTEXT, gql } from '@/lib/graphql/helpers';
import { loggedInUserQuery } from '@/lib/graphql/queries';
import type { FiscalHostingQuery } from '@/lib/graphql/types/v2/graphql';
import { editCollectivePageQuery } from '@/lib/graphql/v1/queries';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';

import { DashboardContext } from '@/components/dashboard/DashboardContext';
import I18nFormatters from '@/components/I18nFormatters';
import { DocumentationLink } from '@/components/Link';

import { useModal } from '../../ModalContext';
import type { ButtonProps } from '../../ui/Button';
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

export const ToggleMoneyManagementButton = ({
  account,
  refetchQueries,
  onSuccess,
  children,
  ...props
}: {
  account: any;
  refetchQueries?: InternalRefetchQueriesInclude;
  /** Called after mutation and refetches complete; use to sync UserProvider with cache (e.g. updateLoggedInUserFromCache). */
  onSuccess?: () => void;
  children?: React.ReactNode;
} & ButtonProps) => {
  const { showConfirmationModal } = useModal();
  const [editMoneyManagementAndHosting, { loading: mutating }] = useMutation(editMoneyManagementAndHostingMutation, {
    refetchQueries,
    onCompleted: onSuccess,
  });
  const { data, loading } = useQuery<FiscalHostingQuery>(fiscalHostingQuery, {
    variables: { id: account.id },
  });

  const totalHostedAccounts = data?.host?.totalHostedAccounts;
  const hasHosting = account.hasHosting;
  const hasMoneyManagement = hasAccountMoneyManagement(account);

  const handleMoneyManagementUpdate = async ({ activate }) => {
    if (activate) {
      await editMoneyManagementAndHosting({
        variables: { organization: { id: account.id }, hasMoneyManagement: true },
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
            variables: { organization: { id: account.id }, hasMoneyManagement: false, hasHosting: false },
          });
        },
        confirmLabel: <FormattedMessage id="Deactivate" defaultMessage="Deactivate" />,
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      onClick={() => handleMoneyManagementUpdate({ activate: !hasMoneyManagement })}
      variant={loading || hasMoneyManagement ? 'outlineDestructive' : 'default'}
      loading={loading || mutating}
      {...props}
    >
      {children ||
        (hasMoneyManagement ? (
          <FormattedMessage id="Deactivate" defaultMessage="Deactivate" />
        ) : (
          <FormattedMessage id="Activate" defaultMessage="Activate" />
        ))}
    </Button>
  );
};

export const ToggleFiscalHostingButton = ({
  account,
  refetchQueries,
  onSuccess,
  children,
  ...props
}: {
  account: any;
  refetchQueries?: InternalRefetchQueriesInclude;
  /** Called after mutation and refetches complete; use to sync UserProvider with cache (e.g. updateLoggedInUserFromCache). */
  onSuccess?: () => void;
  children?: React.ReactNode;
} & ButtonProps) => {
  const { showConfirmationModal } = useModal();
  const hasHosting = account.hasHosting;
  const hasMoneyManagement = hasAccountMoneyManagement(account);
  const { data, loading } = useQuery<FiscalHostingQuery>(fiscalHostingQuery, {
    variables: { id: account.id },
  });

  const totalHostedAccounts = data?.host?.totalHostedAccounts;

  const [editMoneyManagementAndHosting] = useMutation(editMoneyManagementAndHostingMutation, {
    refetchQueries,
    onCompleted: onSuccess,
  });

  const handleFiscalHostUpdate = async ({ activate }) => {
    if (activate) {
      await editMoneyManagementAndHosting({
        variables: { organization: { id: account.id }, hasHosting: true },
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
            variables: { organization: { id: account.id }, hasHosting: false },
          });
        },
        confirmLabel: <FormattedMessage id="Deactivate" defaultMessage="Deactivate" />,
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      onClick={() => handleFiscalHostUpdate({ activate: !hasHosting })}
      disabled={!hasMoneyManagement}
      variant={loading || hasHosting ? 'outlineDestructive' : 'default'}
      loading={loading}
      {...props}
    >
      {children ||
        (hasHosting ? (
          <FormattedMessage id="Deactivate" defaultMessage="Deactivate" />
        ) : (
          <FormattedMessage id="Activate" defaultMessage="Activate" />
        ))}
    </Button>
  );
};

const FiscalHosting = ({ collective }) => {
  const { account } = React.useContext(DashboardContext);
  const { updateLoggedInUserFromCache } = useLoggedInUser();
  const hasMoneyManagement = hasAccountMoneyManagement(account);
  const refetchQueries = [
    {
      query: editCollectivePageQuery,
      context: API_V1_CONTEXT,
      variables: {
        slug: collective.slug,
      },
    },
  ];

  return (
    <div className="mb-10 flex w-full flex-col gap-4">
      <div className="mt-4 flex w-full flex-col gap-4">
        <div>
          <SettingsSectionTitle className="mb-2">
            <FormattedMessage id="FiscalHosting.Functionalities" defaultMessage="Manage Functionalities" />
          </SettingsSectionTitle>
          <p className="text-sm text-gray-700 md:max-w-4/5">
            <FormattedMessage
              id="FiscalHosting.Functionalities.description"
              defaultMessage="Your organization can be used to make contributions on the platform and to submit payment requests. See the options below for more advanced financial capabilities."
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
                defaultMessage="Hold a balance & create accounts to manage your money. Use your accounts to receive contributions and pay expenses on the platform."
                id="FiscalHosting.moneyManagement.description"
              />
            </p>
          </div>
          <ToggleMoneyManagementButton
            className="my-2 w-fit"
            account={account}
            refetchQueries={refetchQueries}
            onSuccess={updateLoggedInUserFromCache}
          />
        </div>

        <div
          className="flex items-center gap-4 rounded-lg border border-border px-6 py-4"
          data-cy="fiscal-hosting-section"
        >
          <Image src="/static/images/welcome/place.png" alt="Fiscal Host Icon" width={52} height={49} />
          <div className="grow">
            <h1 className="mb-2 flex items-center font-bold">
              <FormattedMessage defaultMessage="Fiscal Hosting" id="editCollective.fiscalHosting" />
              {!hasMoneyManagement && (
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  <FormattedMessage
                    defaultMessage="Requires Money Management"
                    id="SetupGuide.RequiresMoneyManagement"
                  />
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-700">
              <FormattedMessage
                defaultMessage="Host collectives and hold money on their behalf (oversee their contributions and expenses). Setup funds and distribute grants on the platform."
                id="FiscalHosting.fiscalHost.description"
              />
            </p>
          </div>
          <ToggleFiscalHostingButton
            className="my-2 w-fit"
            account={account}
            refetchQueries={refetchQueries}
            onSuccess={updateLoggedInUserFromCache}
          />
        </div>
      </div>
    </div>
  );
};

export default FiscalHosting;
