import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';

import { OPENCOLLECTIVE_FOUNDATION_ID } from '../../../../lib/constants/collectives';
import { formatCurrency } from '../../../../lib/currency-utils';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type { ActiveFiscalHostQuery, ActiveFiscalHostQueryVariables } from '../../../../lib/graphql/types/v2/graphql';
import { getDashboardRoute } from '../../../../lib/url-helpers';

import Avatar from '../../../Avatar';
import Container from '../../../Container';
import HostApplicationRequests from '../../../dashboard/sections/collectives/HostApplicationRequests';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { getI18nLink } from '../../../I18nFormatters';
import Link from '../../../Link';
import LinkCollective from '../../../LinkCollective';
import LoadingGrid from '../../../LoadingGrid';
import MessageBox from '../../../MessageBox';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import StyledHr from '../../../StyledHr';
import { Button } from '../../../ui/Button';
import { LeaveHostModal } from '../../LeaveHostModal';

import { FiscalHostOCFTransition } from './FiscalHostOCFTransition';

type ActiveFiscalHostProps = {
  collectiveSlug: string;
  showLegalNameInfoBox: boolean;
};

export function ActiveFiscalHost(props: ActiveFiscalHostProps) {
  const [isConfirmingLeaveHost, setIsConfirmingLeaveHost] = React.useState(false);
  const intl = useIntl();
  const query = useQuery<ActiveFiscalHostQuery, ActiveFiscalHostQueryVariables>(
    gql`
      query ActiveFiscalHost($collectiveSlug: String!) {
        account(slug: $collectiveSlug) {
          id
          legacyId
          type
          slug
          name
          currency
          members {
            nodes {
              role
              createdAt
            }
          }
          ... on AccountWithHost {
            approvedAt
            host {
              id
              legacyId
              slug
              name
              currency
            }
          }
          ... on AccountWithParent {
            parent {
              id
            }
          }
          events: childrenAccounts(accountType: EVENT) {
            totalCount
          }
          projects: childrenAccounts(accountType: PROJECT) {
            totalCount
          }
          stats {
            consolidatedBalance: balance(includeChildren: true) {
              valueInCents
              currency
            }
          }
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        collectiveSlug: props.collectiveSlug,
      },
    },
  );

  const collective = query.data?.account;
  const host = collective && 'host' in collective ? collective.host : null;
  const approvedAt = collective && 'approvedAt' in collective ? collective.approvedAt : null;

  if (query.error) {
    return <MessageBoxGraphqlError error={query.error} />;
  }

  if (query.loading || !collective) {
    return (
      <div className="m-auto">
        <LoadingGrid />
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-2 mt-8 text-base font-bold">
        <FormattedMessage defaultMessage="Active Fiscal Host" id="e2wNyb" />
      </h2>
      <div className="flex justify-between gap-4 rounded-lg border border-gray-300 p-4">
        {/** Host info */}
        <div className="flex gap-4">
          <LinkCollective collective={host}>
            <Avatar collective={host} radius={48} />
          </LinkCollective>
          <div className="flex flex-col justify-center">
            <p className="text-base font-bold">
              <LinkCollective collective={host} />
            </p>
            <p className="text-sm">
              <span>
                <FormattedMessage
                  id="withColon"
                  defaultMessage="{item}:"
                  values={{ item: <FormattedMessage id="HostedSince" defaultMessage="Hosted since" /> }}
                />{' '}
                {approvedAt ? <FormattedDate dateStyle="medium" value={approvedAt} /> : <span>-</span>}
              </span>
              .{' '}
              <span>
                <FormattedMessage
                  defaultMessage="Host currency: {currency}"
                  id="fPQ9XL"
                  values={{ currency: host?.currency }}
                />
              </span>
            </p>
          </div>
        </div>
        {/** Collective balance */}
        {collective?.stats?.consolidatedBalance?.valueInCents > 0 && (
          <div className="text-right">
            <FormattedMoneyAmount
              amount={collective.stats.consolidatedBalance.valueInCents}
              currency={collective.stats.consolidatedBalance.currency}
              amountClassName="text-xl font-bold"
              precision={2}
            />
            {(collective.events.totalCount > 0 || collective.projects.totalCount > 0) && (
              <p className="text-sm">
                <FormattedMessage
                  defaultMessage="Including {eventsCount, plural, zero {} one {one event} other {# events}}{both, select, true { and } other {}}{projectsCount, plural, zero {} one {one project} other {# projects}}"
                  id="WR7z/n"
                  values={{
                    eventsCount: collective.events.totalCount,
                    projectsCount: collective.projects.totalCount,
                    both: collective.events.totalCount > 0 && collective.projects.totalCount > 0,
                  }}
                />
              </p>
            )}
          </div>
        )}
      </div>
      {host?.legacyId === OPENCOLLECTIVE_FOUNDATION_ID && !('parent' in collective) ? (
        <div className="mt-8">
          <FiscalHostOCFTransition collective={collective} />
        </div>
      ) : (
        <React.Fragment>
          <div className="mt-6">
            {collective?.stats?.consolidatedBalance.valueInCents > 0 && (
              <p className="mb-2">
                <FormattedMessage
                  id="editCollective.host.balance"
                  defaultMessage="It currently holds {balance} on behalf of {type, select, COLLECTIVE {your Collective} FUND {your Fund} other {your Account}}."
                  values={{
                    balance: (
                      <strong>
                        {formatCurrency(
                          collective.stats.consolidatedBalance.valueInCents,
                          collective.stats.consolidatedBalance.currency,
                          { locale: intl.locale },
                        )}
                      </strong>
                    ),
                    type: collective.type,
                  }}
                />
              </p>
            )}
            {collective?.stats?.consolidatedBalance.valueInCents > 0 && (
              <p>
                <FormattedMessage
                  id="editCollective.host.change.balanceNotEmpty"
                  defaultMessage="To change your Fiscal Host, you first need to empty {type, select, COLLECTIVE {your Collective's balance} FUND {your Fund's balance} other {your balance}}. You can do this by <SubmitExpenseLink>submitting expenses</SubmitExpenseLink>, making financial contributions, or sending the balance to your Fiscal Host using the <EmptyBalanceLink>Empty Balance</EmptyBalanceLink> feature."
                  values={{
                    type: collective.type,
                    SubmitExpenseLink: getI18nLink({
                      as: Link,
                      href: `/${collective.slug}/expenses/new`,
                    }),
                    EmptyBalanceLink: getI18nLink({
                      as: Link,
                      href: getDashboardRoute(collective, 'advanced'),
                    }),
                  }}
                />
              </p>
            )}
            {collective?.stats?.consolidatedBalance.valueInCents === 0 && (
              <div className="mt-2 flex">
                <div>
                  <Button variant="outline" size="lg" onClick={() => setIsConfirmingLeaveHost(true)}>
                    <FormattedMessage id="editCollective.host.leave" defaultMessage="Leave Host" />
                  </Button>
                </div>
              </div>
            )}
            {props.showLegalNameInfoBox && (
              <Container mt={4}>
                <MessageBox type="info" fontSize="13px" withIcon>
                  <FormattedMessage
                    id="collective.edit.host.legalName.info"
                    defaultMessage="Please set the legal name {isSelfHosted, select, false {of the host} other {}} in the Info section of <SettingsLink>the settings</SettingsLink>. This is required if the legal name is different than the display name for tax and accounting purposes."
                    values={{
                      SettingsLink: getI18nLink({ href: `/dashboard/${host?.slug}` }),
                      isSelfHosted: collective.id === host?.id,
                    }}
                  />
                </MessageBox>
              </Container>
            )}
            {isConfirmingLeaveHost && (
              <LeaveHostModal account={collective} host={host} onClose={() => setIsConfirmingLeaveHost(false)} />
            )}
          </div>
          <StyledHr my={4} />
          <h2 className="mb-3 font-bold">
            <FormattedMessage defaultMessage="Applications" id="DqD1yK" />
          </h2>
          <HostApplicationRequests accountSlug={collective?.slug} />
        </React.Fragment>
      )}
    </div>
  );
}
