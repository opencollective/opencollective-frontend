import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { Download, Pencil } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import { Account, LegalDocument } from '../../../../lib/graphql/types/v2/graphql';
import formatCollectiveType from '../../../../lib/i18n/collective-type';
import { i18nExpenseType } from '../../../../lib/i18n/expense';
import { getCollectivePageRoute, getDashboardRoute } from '../../../../lib/url-helpers';

import { AccountHoverCard, accountHoverCardFields } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import { Drawer, DrawerHeader } from '../../../Drawer';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { getI18nLink } from '../../../I18nFormatters';
import Link from '../../../Link';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import { Button } from '../../../ui/Button';

import { DownloadLegalDocument } from './DownloadLegalDocument';
import { LegalDocumentServiceBadge } from './LegalDocumentServiceBadge';
import { LegalDocumentStatusBadge } from './LegalDocumentStatusBadge';

type LegalDocumentDrawerProps = {
  open: boolean;
  onClose: () => void;
  document?: LegalDocument;
  host: Account;
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

const DataList = ({ title, value }) => {
  return (
    <div className="relative flex w-full flex-col gap-1 sm:flex-row">
      <div className="min-w-[180px] max-w-[240px] shrink-0 grow-0 basis-1/4 text-muted-foreground">{title}</div>
      <div className="max-w-fit overflow-hidden">{value}</div>
    </div>
  );
};

export default function LegalDocumentDrawer({ open, onClose, host, document }: LegalDocumentDrawerProps) {
  const intl = useIntl();
  const { data, loading } = useQuery(legalDocumentDrawerQuery, {
    context: API_V2_CONTEXT,
    variables: { hostId: host.id, accountId: document?.account.id },
    skip: !document,
  });

  return (
    <Drawer open={open} onClose={onClose} data-cy="legal-document-drawer">
      <DrawerHeader
        onClose={onClose}
        title={
          <span className="text-xl font-semibold">
            <FormattedMessage defaultMessage="Tax Form Details" id="9YSa2T" />
          </span>
        }
      />
      <div className="flex gap-2">
        {Boolean(document?.documentLink) && (
          <DownloadLegalDocument legalDocument={document}>
            {({ download, isDownloading }) => (
              <Button variant="outline" size="xs" loading={isDownloading} onClick={download}>
                <Download size={16} />
                <FormattedMessage id="n+rgej" defaultMessage="Download {format}" values={{ format: 'PDF' }} />
              </Button>
            )}
          </DownloadLegalDocument>
        )}
        <Button variant="outline" size="xs">
          <Pencil size={16} />
          <FormattedMessage defaultMessage="Update status" id="LegalDocument.ChangeStatus" />
        </Button>
      </div>
      <hr className="my-4 border-t border-slate-300" />
      {document && (
        <div className="text-sm">
          <div className="flex flex-col gap-3 sm:gap-2">
            <DataList
              title={intl.formatMessage({ defaultMessage: 'Account', id: 'TwyMau' })}
              value={
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
            <DataList
              title={intl.formatMessage({ defaultMessage: 'Type', id: 'AccountTypeShort' })}
              value={formatCollectiveType(intl, document.account.type)}
            />
            <DataList
              title={intl.formatMessage({ defaultMessage: 'Service', id: 'n7yYXG' })}
              value={<LegalDocumentServiceBadge service={document.service} />}
            />{' '}
            <DataList
              title={intl.formatMessage({ defaultMessage: 'Status', id: 'LegalDocument.Status' })}
              value={<LegalDocumentStatusBadge status={document.status} />}
            />
            <DataList title={intl.formatMessage({ defaultMessage: 'Year', id: 'IFo1oo' })} value={document.year} />
            <DataList
              title={intl.formatMessage({ defaultMessage: 'Requested at', id: 'LegalDocument.RequestedAt' })}
              value={<DateTime dateStyle="medium" timeStyle="short" value={document.requestedAt} />}
            />
            <DataList
              title={intl.formatMessage({ defaultMessage: 'Updated at', id: 'LegalDocument.UpdatedAt' })}
              value={<DateTime dateStyle="medium" timeStyle="short" value={document.updatedAt} />}
            />
          </div>
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
                            href: `${getCollectivePageRoute(expense.account)}/expenses/${expense.id}`,
                            title: expense.description,
                            textDecoration: 'underline',
                            color: 'black.900',
                          }),
                          amount: (
                            <FormattedMoneyAmount
                              amount={expense.amountV2.valueInCents}
                              currency={expense.amountV2.currency}
                              amountStyles={null}
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
                          host.slug,
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
        </div>
      )}
    </Drawer>
  );
}
