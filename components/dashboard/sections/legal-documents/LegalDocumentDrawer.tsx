import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import type { GetActions } from '../../../../lib/actions/types';
import type { Account } from '../../../../lib/graphql/types/v2/schema';
import formatCollectiveType from '../../../../lib/i18n/collective-type';
import { i18nExpenseType } from '../../../../lib/i18n/expense';
import { getCollectivePageRoute, getDashboardRoute } from '../../../../lib/url-helpers';
import type { LegalDocumentFieldsFragment } from '@/lib/graphql/types/v2/graphql';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '@/lib/preview-features';

import LinkCollective from '@/components/LinkCollective';

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
import { ALL_SECTIONS } from '../../constants';

import { LegalDocumentServiceBadge } from './LegalDocumentServiceBadge';
import { LegalDocumentStatusBadge } from './LegalDocumentStatusBadge';

type LegalDocumentDrawerProps = {
  open: boolean;
  onClose: () => void;
  document?: LegalDocumentFieldsFragment;
  host: Pick<Account, 'id' | 'slug'>;
  getActions: GetActions<LegalDocumentFieldsFragment>;
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
  const { LoggedInUser } = useLoggedInUser();
  const dropdownTriggerRef = React.useRef(undefined);
  const { data, loading } = useQuery(legalDocumentDrawerQuery, {
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
              <LinkCollective
                className="hover:text-primary hover:underline"
                collective={document.account}
                withHoverCard
              >
                <div className="flex items-center gap-1 font-medium">
                  <Avatar radius={20} collective={document.account} />
                  {document.account.name}
                </div>
              </LinkCollective>
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
                            LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SIDEBAR_REORG_DISBURSEMENTS)
                              ? ALL_SECTIONS.HOST_PAYMENT_REQUESTS
                              : ALL_SECTIONS.HOST_EXPENSES,
                            {
                              params: new URLSearchParams([
                                ['searchTerm', `@${document.account.slug}`],
                                ['type', 'INVOICE'],
                                ['type', 'GRANT'],
                                ['type', 'UNCLASSIFIED'],
                                ...(!LoggedInUser?.hasPreviewFeatureEnabled(
                                  PREVIEW_FEATURE_KEYS.SIDEBAR_REORG_DISBURSEMENTS,
                                )
                                  ? [['status', 'ALL']] // Only needed for the `host-expenses` tool as it has a default value for status
                                  : []),
                              ]),
                            },
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
