import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import type { GetActions } from '../../../../lib/actions/types';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type { Account, LegalDocument } from '../../../../lib/graphql/types/v2/schema';
import formatCollectiveType from '../../../../lib/i18n/collective-type';
import { i18nExpenseType } from '../../../../lib/i18n/expense';
import { getCollectivePageRoute, getDashboardRoute } from '../../../../lib/url-helpers';

import { AccountHoverCard, accountHoverCardFields } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import { CopyID } from '../../../CopyId';
import DateTime from '../../../DateTime';
import DrawerHeader from '../../../DrawerHeader';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { getI18nLink } from '../../../I18nFormatters';
import Link from '../../../Link';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import { DataList, DataListItem } from '../../../ui/DataList';
import { Sheet, SheetBody, SheetContent } from '../../../ui/Sheet';

import { LegalDocumentServiceBadge } from './LegalDocumentServiceBadge';
import { LegalDocumentStatusBadge } from './LegalDocumentStatusBadge';

type LegalDocumentDrawerProps = {
  open: boolean;
  onClose: () => void;
  document?: LegalDocument;
  host: Account;
  getActions: GetActions<LegalDocument>;
};

const legalDocumentDrawerQuery = gql`
  query LegalDocumentDrawer($hostId: String!, $accountId: String!) {
    expenses(
      limit: 5
      fromAccount: { id: $accountId }
      host: { id: $hostId }
      orderBy: { field: CREATED_AT, direction: DESC }
      types: [INVOICE, GRANT, UNCLASSIFIED]
    ) {
      totalCount
      nodes {
        id
        legacyId
        type
        description
        createdAt
        amountV2 {
          valueInCents
          currency
        }
        account {
          ...AccountHoverCardFields
        }
      }
    }
  }
  ${accountHoverCardFields}
`;

export default function LegalDocumentDrawer({
  open,
  onClose,
  host,
  document,
  getActions,
}: Readonly<LegalDocumentDrawerProps>) {
  const intl = useIntl();
  const dropdownTriggerRef = React.useRef();
  const { data, loading } = useQuery(legalDocumentDrawerQuery, {
    context: API_V2_CONTEXT,
    variables: { hostId: host.id, accountId: get(document, 'account.id') },
    skip: !document,
  });

  return (
    <Sheet open={open} onOpenChange={onClose} data-cy="legal-document-drawer">
      {document && (
        <SheetContent className="text-sm">
          <DrawerHeader
            dropdownTriggerRef={dropdownTriggerRef}
            actions={getActions(document, dropdownTriggerRef)}
            entityName={intl.formatMessage({ defaultMessage: 'Tax form', id: 'TaxForm' })}
            entityIdentifier={<CopyID value={document.id}>{document.id}</CopyID>}
            entityLabel={
              <AccountHoverCard
                account={document.account}
                trigger={
                  <Link
                    className="flex items-center gap-1 font-medium hover:text-primary hover:underline"
                    href={getCollectivePageRoute(document.account)}
                  >
                    <Avatar radius={20} collective={document.account} />
                    {document.account.name}
                  </Link>
                }
              />
            }
          />
          <SheetBody>
            <DataList>
              <DataListItem
                label={intl.formatMessage({ defaultMessage: 'Account Type', id: 'K1uUiB' })}
                value={formatCollectiveType(intl, document.account.type)}
              />
              <DataListItem
                label={intl.formatMessage({ defaultMessage: 'Service', id: 'n7yYXG' })}
                value={<LegalDocumentServiceBadge service={document.service} />}
              />
              <DataListItem
                label={intl.formatMessage({ defaultMessage: 'Status', id: 'LegalDocument.Status' })}
                value={<LegalDocumentStatusBadge status={document.status} />}
              />
              <DataListItem
                label={intl.formatMessage({ defaultMessage: 'Year', id: 'IFo1oo' })}
                value={document.year}
              />
              <DataListItem
                label={intl.formatMessage({ defaultMessage: 'Requested at', id: 'LegalDocument.RequestedAt' })}
                value={<DateTime dateStyle="medium" timeStyle="short" value={document.requestedAt} />}
              />
              <DataListItem
                label={intl.formatMessage({ defaultMessage: 'Updated at', id: 'LegalDocument.UpdatedAt' })}
                value={<DateTime dateStyle="medium" timeStyle="short" value={document.updatedAt} />}
              />
            </DataList>

            <hr className="my-4 border-t border-slate-300" />
            <div className="flex flex-col gap-2">
              <div className="text-base font-medium">
                <FormattedMessage defaultMessage="Related expenses" id="ihL8wM" />
              </div>

              <div>
                {loading ? (
                  <LoadingPlaceholder height={200} />
                ) : !data?.expenses.nodes.length ? (
                  <FormattedMessage defaultMessage="No expenses" id="expenses.empty" />
                ) : (
                  <ul className="list-inside list-disc">
                    {data?.expenses.nodes.map(expense => (
                      <li key={expense.id}>
                        <FormattedMessage
                          defaultMessage="{date}: <ExpenseLink>{amount} {expenseType}</ExpenseLink> to {account}"
                          id="VGuckw"
                          values={{
                            date: <DateTime dateStyle="medium" value={expense.createdAt} />,
                            ExpenseLink: getI18nLink({
                              href: `${getCollectivePageRoute(expense.account)}/expenses/${expense.legacyId}`,
                              title: expense.description,
                              textDecoration: 'underline',
                              color: 'black.900',
                            }),
                            amount: (
                              <FormattedMoneyAmount
                                amount={expense.amountV2.valueInCents}
                                currency={expense.amountV2.currency}
                              />
                            ),
                            expenseType: i18nExpenseType(intl, expense.type),
                            account: (
                              <AccountHoverCard
                                account={expense.account}
                                trigger={
                                  <Link
                                    className="font-medium hover:text-primary hover:underline"
                                    href={getCollectivePageRoute(expense.account)}
                                  >
                                    {expense.account.name}
                                  </Link>
                                }
                              />
                            ),
                          }}
                        />
                      </li>
                    ))}
                    {data.expenses.totalCount > data.expenses.nodes.length && (
                      <li>
                        <Link
                          className="text-primary underline"
                          href={getDashboardRoute(
                            host,
                            `host-expenses?searchTerm=@${document.account.slug}&status=ALL&types=INVOICE,GRANT,UNCLASSIFIED`,
                          )}
                        >
                          <FormattedMessage
                            defaultMessage="...and {count} more"
                            id="AndMoreExpenses"
                            values={{ count: data.expenses.totalCount - data.expenses.nodes.length }}
                          />
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </SheetBody>
        </SheetContent>
      )}
    </Sheet>
  );
}
