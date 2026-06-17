import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '@/lib/errors';
import type { Account, ConnectedAccount, EditStripeAccountQuery } from '@/lib/graphql/types/v2/graphql';

import { ConnectedAccountsTable } from '../ConnectedAccountsTable';
import MessageBox from '../MessageBox';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { useToast } from '../ui/useToast';

const editStripeAccountQuery = gql`
  query EditStripeAccount($slug: String!) {
    account(slug: $slug) {
      id
      connectedAccounts(service: stripe) {
        id
        legacyId
        service
        createdAt
        settings
        hash
        createdByAccount {
          id
          legacyId
          name
          slug
        }
      }
    }
  }
`;

const getStripeOAuthUrlMutation = gql`
  mutation GetStripeOAuthUrl($account: AccountReferenceInput!, $redirect: String) {
    getStripeOAuthUrl(account: $account, redirect: $redirect)
  }
`;

const deleteStripeAccountMutation = gql`
  mutation DeleteStripeConnectedAccount($id: String!) {
    deleteConnectedAccount(connectedAccount: { id: $id }) {
      id
      service
    }
  }
`;

const EditStripeAccount = ({ collective }: { collective: Pick<Account, 'slug'> }) => {
  const router = useRouter();
  const intl = useIntl();
  const { toast } = useToast();
  const { data, loading, refetch } = useQuery<EditStripeAccountQuery>(editStripeAccountQuery, {
    variables: { slug: collective.slug },
  });
  const [getStripeOAuthUrl, { loading: connecting }] = useMutation(getStripeOAuthUrlMutation);
  const [deleteStripeAccount] = useMutation(deleteStripeAccountMutation);
  const connectedAccounts = data?.account?.connectedAccounts;

  const handleConnect = async () => {
    try {
      const redirect = window.location.href.replace(/\?.*/, '');
      const { data } = await getStripeOAuthUrl({
        variables: { account: { slug: collective.slug }, redirect },
      });
      window.location.href = data.getStripeOAuthUrl;
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }
  };

  const handleDisconnect = async (connectedAccount: Partial<ConnectedAccount>) => {
    try {
      await deleteStripeAccount({ variables: { id: connectedAccount.id } });
      await refetch();
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }
  };

  const error = router.query?.error;
  if (loading) {
    return <Skeleton className="mb-3 h-10 w-full" />;
  }
  return (
    <React.Fragment>
      {error && (
        <MessageBox withIcon type="error" mb={3}>
          {error}
        </MessageBox>
      )}
      {!connectedAccounts?.length ? (
        <React.Fragment>
          <div className="mb-3 text-sm text-gray-700">
            <FormattedMessage
              id="collective.create.connectedAccounts.stripe.description"
              defaultMessage="Connect a Stripe account to start accepting financial contributions."
            />
          </div>
          <Button size="sm" className="w-fit" type="button" onClick={handleConnect} loading={connecting}>
            <FormattedMessage defaultMessage="Connect {service}" id="C9HmCs" values={{ service: 'Stripe' }} />
          </Button>
        </React.Fragment>
      ) : (
        <ConnectedAccountsTable
          connectedAccounts={connectedAccounts as Partial<ConnectedAccount>[]}
          disconnect={handleDisconnect}
          reconnect={handleConnect}
        />
      )}
    </React.Fragment>
  );
};

export default EditStripeAccount;
