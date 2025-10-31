import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { useRouter } from 'next/router';

import { API_V2_CONTEXT } from '@/lib/graphql/helpers';

import Link from '@/components/Link';

import { useGetLinkProps } from '../lib';
import {
  searchAccountFieldsFragment,
  searchExpenseFieldsFragment,
  searchHostApplicationFieldsFragment,
  searchOrderFieldsFragment,
  searchTransactionFieldsFragment,
  searchUpdateFieldsFragment,
} from '../queries';
import { SearchEntity } from '../schema';
import { SearchCommandItem } from '../SearchCommandItem';
import type { PageVisit } from '../useRecentlyVisited';

import { AccountResult } from './AccountResult';
import { ExpenseResult } from './ExpenseResult';
import { HostApplicationResult } from './HostApplicationResult';
import { LoadingResult } from './LoadingResult';
import { OrderResult } from './OrderResult';
import { TransactionResult } from './TransactionResult';
import { UpdateResult } from './UpdateResult';

const entities = {
  [SearchEntity.ACCOUNTS]: {
    query: gql`
      query AccountResult($id: String, $imageHeight: Int) {
        account(id: $id) {
          id
          ...SearchAccountFields
        }
      }
      ${searchAccountFieldsFragment}
    `,
    Component: ({ data }) => {
      return <AccountResult account={data} />;
    },
    pickData: data => data.account,
  },
  [SearchEntity.EXPENSES]: {
    query: gql`
      query ExpenseResult($id: String, $imageHeight: Int) {
        expense(expense: { id: $id }) {
          id
          ...SearchExpenseFields
        }
      }
      ${searchExpenseFieldsFragment}
    `,
    Component: ({ data }) => <ExpenseResult expense={data} />,
    pickData: data => data.expense,
  },
  [SearchEntity.HOST_APPLICATIONS]: {
    query: gql`
      query HostApplicationResult($id: String, $imageHeight: Int) {
        hostApplication(hostApplication: { id: $id }) {
          id
          ...SearchHostApplicationFields
        }
      }
      ${searchHostApplicationFieldsFragment}
    `,
    Component: ({ data }) => <HostApplicationResult hostApplication={data} />,
    pickData: data => data.hostApplication,
  },
  [SearchEntity.ORDERS]: {
    query: gql`
      query OrderResult($id: String, $imageHeight: Int) {
        order(order: { id: $id }) {
          id
          ...SearchOrderFields
        }
      }
      ${searchOrderFieldsFragment}
    `,
    Component: ({ data }) => <OrderResult order={data} />,
    pickData: data => data.order,
  },
  [SearchEntity.TRANSACTIONS]: {
    query: gql`
      query TransactionResult($id: String, $imageHeight: Int) {
        transaction(transaction: { id: $id }) {
          id
          ...SearchTransactionFields
        }
      }
      ${searchTransactionFieldsFragment}
    `,
    Component: ({ data }) => <TransactionResult transaction={data} />,
    pickData: data => data.transaction,
  },
  [SearchEntity.UPDATES]: {
    query: gql`
      query UpdateResult($id: String, $imageHeight: Int) {
        update(id: $id) {
          id
          ...SearchUpdateFields
        }
      }
      ${searchUpdateFieldsFragment}
    `,
    Component: ({ data }) => <UpdateResult update={data} />,
    pickData: data => data.update,
  },
};

export function RecentVisit({
  entity,
  id,
  setOpen,
  removeFromRecent,
}: {
  entity: PageVisit['entity'];
  id: string;
  setOpen: (open: boolean) => void;
  removeFromRecent: (id: string) => void;
}) {
  const router = useRouter();
  const { getLinkProps } = useGetLinkProps();

  const { query, Component, pickData } = entities[entity];
  const { data, loading, error } = useQuery(query, { context: API_V2_CONTEXT, variables: { imageHeight: 72, id } });
  if (loading) {
    return <LoadingResult />;
  }
  if (data && !error) {
    const { href, onClick } = getLinkProps({ entity, data: pickData(data) });

    return (
      <SearchCommandItem
        onSelect={() => {
          router.push(href);
          setOpen(false);
          onClick?.();
        }}
        onDelete={() => removeFromRecent(id)}
      >
        <Link href={href} className="block w-full">
          <Component data={pickData(data)} />
        </Link>
      </SearchCommandItem>
    );
  }
  return null;
}
