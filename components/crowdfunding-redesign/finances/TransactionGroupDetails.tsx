import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import { i18nTransactionKind } from '../../../lib/i18n/transaction';

import DateTime from '../../DateTime';
import FormattedMoneyAmount from '../../FormattedMoneyAmount';
import { DataList, DataListItem, DataListItemLabel, DataListItemValue } from '../../ui/DataList';

import { TransactionGroupCard } from './TransactionGroupCard';

const transactionGroupDetailsQuery = gql`
  query TransactionGroupDetails($slug: String, $groupId: String!) {
    transactionGroup(account: { slug: $slug }, groupId: $groupId) {
      id
      totalAmount {
        valueInCents
        currency
      }
      account {
        id
        name
        slug
        imageUrl
      }
      createdAt
      primaryTransaction {
        kind
        type
        oppositeAccount {
          id
          name
          slug
          imageUrl
          type
        }
      }
      transactions {
        id
        kind
        type
        account {
          id
          name
          slug
          imageUrl
          type
        }
        oppositeAccount {
          id
          name
          slug
          imageUrl
          type
        }
        expense {
          id
          status
          amountV2 {
            valueInCents
            currency
          }
        }
        order {
          id
        }
        amount {
          valueInCents
          currency
        }
      }
    }
  }
`;

export function TransactionGroupDetails() {
  const router = useRouter();
  const { data } = useQuery(transactionGroupDetailsQuery, {
    variables: {
      slug: router.query.accountSlug || router.query.collectiveSlug,
      groupId: router.query.groupId,
    },
    // skip: !router.query.groupId || !router.query.accountSlug,
    fetchPolicy: 'cache-and-network',
    context: API_V2_CONTEXT,
  });
  const intl = useIntl();
  return (
    <div className="">
      <div className="relative mx-auto flex max-w-(--breakpoint-lg) flex-col gap-8 px-6 py-12">
        <h3 className="text-2xl leading-none font-semibold tracking-tight">
          Transaction group {router.query.groupId.slice(0, 8)}
        </h3>
        <TransactionGroupCard
          asHero
          group={data?.transactionGroup}
          className="rounded-xl border bg-background text-lg"
        />
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-6 rounded-xl border bg-background p-6">
            <h3 className="text-lg font-medium tracking-tight">Transaction details</h3>
            <DataList>
              <DataListItem>
                <DataListItemLabel>
                  <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />
                </DataListItemLabel>
                <DataListItemValue className="flex w-full max-w-full justify-end text-right">
                  {data?.transactionGroup?.createdAt && (
                    <DateTime dateStyle="medium" timeStyle="short" value={data?.transactionGroup?.createdAt} />
                  )}
                </DataListItemValue>
              </DataListItem>
              {data?.transactionGroup.transactions.map(transaction => (
                <DataListItem key={transaction.id}>
                  <DataListItemLabel>{i18nTransactionKind(intl, transaction.kind)}</DataListItemLabel>
                  <DataListItemValue className="flex w-full max-w-full justify-end text-right">
                    <FormattedMoneyAmount
                      amount={transaction.amount.valueInCents}
                      currency={transaction.amount.currency}
                      showCurrencyCode={false}
                    />
                  </DataListItemValue>
                </DataListItem>
              ))}
            </DataList>
          </div>
          <div className="space-y-6 rounded-xl border bg-background p-6">
            <h3 className="text-lg font-medium tracking-tight">
              {data?.transactionGroup.primaryTransaction.kind === 'EXPENSE' ? 'Expense details' : 'Order details'}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}
