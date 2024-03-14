import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { OPENCOLLECTIVE_FOUNDATION_ID } from '../lib/constants/collectives';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import { Account, OcfTransitionBannerQuery, OcfTransitionBannerQueryVariables } from '../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { getCollectivePageRoute, getDashboardRoute } from '../lib/url-helpers';
import { cn } from '../lib/utils';

import { Button } from './ui/Button';
import Link from './Link';
import LinkCollective from './LinkCollective';
import MessageBox from './MessageBox';
import MessageBoxGraphqlError from './MessageBoxGraphqlError';

const Message = ({ collective, params, isCentered = false, hideNextSteps = false }) => (
  <React.Fragment>
    Find more information here:{' '}
    <Link href="https://blog.opencollective.com/open-collective-official-statement-ocf-dissolution/" openInNewTab>
      Open Collective official Statement
    </Link>
    . <br />
    <br />
    <div>
      We want to help, please fill in{' '}
      <a
        href={`https://coda.io/form/Transition-Support_dzhPGdiqXVw?${params}`}
        target="_blank"
        className="font-semibold"
        rel="noreferrer"
      >
        this form
        <ArrowUpRight className="inline-block align-baseline" size={15} />
      </a>{' '}
      so we can actively help you find a new host.
      {!hideNextSteps && (
        <div className={cn('mt-3 flex items-center gap-3', { 'justify-center': isCentered })}>
          <div>Next Steps:</div>
          <Link href={getDashboardRoute(collective, 'host')}>
            <Button variant="outline">
              <FormattedMessage id="AdminPanel.FiscalHostSettings" defaultMessage="Fiscal Host Settings" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  </React.Fragment>
);

export const OCFCollectivePageBanner = ({ collective, LoggedInUser }) => {
  const params = new URLSearchParams();
  params.append('collectiveSlug', collective.slug);
  params.append('userSlug', LoggedInUser?.collective?.slug);
  return {
    type: 'warning',
    title: 'Open Collective Official Statement: OCF Dissolution',
    description: <Message isCentered collective={collective} params={params.toString()} />,
  };
};

type OCFBannerProps = {
  collective: Pick<Account, 'slug'>;
  hideNextSteps?: boolean;
};

export function OCFBanner(props: OCFBannerProps) {
  const { LoggedInUser } = useLoggedInUser();
  const query = useQuery<OcfTransitionBannerQuery, OcfTransitionBannerQueryVariables>(
    gql`
      query OCFTransitionBanner($slug: String!) {
        account(slug: $slug) {
          id
          name
          slug
          ... on AccountWithHost {
            host {
              id
              legacyId
            }
          }
          oldAccount: members(role: [CONNECTED_ACCOUNT], limit: 1) {
            totalCount
            nodes {
              id
              role
              publicMessage
              description
              account {
                id
                name
                slug
                imageUrl
                ... on AccountWithHost {
                  host {
                    id
                    legacyId
                  }
                }
              }
            }
          }

          newAccount: memberOf(role: [CONNECTED_ACCOUNT], limit: 1) {
            totalCount
            nodes {
              id
              role
              publicMessage
              description
              account {
                id
                name
                slug
                imageUrl
                ... on AccountWithHost {
                  host {
                    id
                    legacyId
                  }
                }
              }
            }
          }
        }
      }
    `,
    {
      variables: {
        slug: props.collective?.slug,
      },
      skip: !props.collective?.slug,
      context: API_V2_CONTEXT,
    },
  );

  const account = query.data?.account;
  const host = account && 'host' in account ? account.host : null;

  const isOCFHostedAccount = host?.legacyId === OPENCOLLECTIVE_FOUNDATION_ID;
  const newAccount = React.useMemo(() => {
    return (query.data?.account?.newAccount?.nodes ?? [])
      .filter(member => {
        if ('host' in member.account) {
          return member.account.host.legacyId !== OPENCOLLECTIVE_FOUNDATION_ID;
        } else {
          return true;
        }
      })
      .map(member => member.account)
      .find(Boolean);
  }, [query.data?.account?.newAccount]);

  const oldAccount = React.useMemo(() => {
    return (query.data?.account?.oldAccount?.nodes ?? [])
      .filter(member => {
        if ('host' in member.account) {
          return member.account.host.legacyId === OPENCOLLECTIVE_FOUNDATION_ID;
        } else {
          return false;
        }
      })
      .map(member => member.account)
      .find(Boolean);
  }, [query.data?.account?.oldAccount]);

  const oldAccountHost = oldAccount && 'host' in oldAccount ? oldAccount.host : null;
  const newAccountHost = newAccount && 'host' in newAccount ? newAccount.host : null;

  const params = new URLSearchParams();
  params.append('collectiveSlug', account?.slug);
  params.append('userSlug', LoggedInUser?.collective?.slug);

  if (query.loading) {
    return null;
  }

  if (query.error) {
    return <MessageBoxGraphqlError error={query.error} />;
  }

  if (isOCFHostedAccount && (!newAccount || newAccountHost.legacyId === OPENCOLLECTIVE_FOUNDATION_ID)) {
    return (
      <MessageBox type="warning" className="mb-4">
        <div className="flex flex-col gap-3">
          <p className="text-lg font-semibold">Your Fiscal Host Open Collective Foundation is closing down</p>
          <p className="text-sm">
            <Message collective={account} params={params.toString()} hideNextSteps={props.hideNextSteps} />
          </p>
        </div>
      </MessageBox>
    );
  }

  if (isOCFHostedAccount && newAccount) {
    return (
      <MessageBox type="error" className="mb-4">
        <div className="flex flex-col gap-3">
          <p className="text-lg font-semibold">This is a limited account. Spend your remaining balance.</p>
          <div className="text-sm">
            This account now operates under <LinkCollective collective={newAccount}>@{newAccount.slug}</LinkCollective>.
            It is not able to receive contributions. You can zero-out this account by doing any of the following:
            <ul className="list-outside list-disc pl-4">
              <li className="mt-1 text-neutral-700">
                <Link href={`${getCollectivePageRoute(oldAccount)}/expenses/new`}>
                  <span className="underline">Submit expenses</span>{' '}
                  <ExternalLink size={16} className="inline align-text-top" />
                </Link>
              </li>
              <li className="mt-1">
                <Link href={getDashboardRoute(oldAccount, 'advanced')}>
                  <span className="underline">
                    Transfer your balance to Open Collective Foundation (Your current host)
                  </span>{' '}
                  <ExternalLink size={16} className="inline align-text-top" />
                </Link>
                <p className="font-normal">
                  Choose this option if you have an agreement with OCF to transfer your funds to your new Fiscal Host.
                </p>
              </li>
            </ul>
          </div>
          {!props.hideNextSteps && (
            <div className="mt-3 flex items-center gap-3">
              <div>Next Steps:</div>
              <Link href={getDashboardRoute(account, 'host')}>
                <Button variant="outline">
                  <FormattedMessage id="AdminPanel.FiscalHostSettings" defaultMessage="Fiscal Host Settings" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </MessageBox>
    );
  }

  if (!isOCFHostedAccount && oldAccountHost?.legacyId === OPENCOLLECTIVE_FOUNDATION_ID) {
    return (
      <MessageBox type="warning" className="mb-4">
        <div className="flex flex-col gap-3">
          <p className="text-lg font-semibold">Reminder: You have an account pending to close.</p>
          <p className="text-sm">
            The remaining balance from your previous Fiscal Host is in this account:{' '}
            <a href={`/${oldAccount.slug}`}>@{oldAccount.slug}</a> Is not able to receive contributions, you should
            zero-out this account soon.
          </p>
        </div>
      </MessageBox>
    );
  }

  return null;
}
