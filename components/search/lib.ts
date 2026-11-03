import React, { useCallback } from 'react';
import type { ApolloError } from '@apollo/client';
import type { GraphQLFormattedError } from 'graphql';

import { CollectiveType } from '@/lib/constants/collectives';
import type { Comment, HostApplication, Order, Update } from '@/lib/graphql/types/v2/graphql';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import {
  getCollectivePageRoute,
  getCommentUrl,
  getDashboardRoute,
  getExpensePageUrl,
  getHostApplicationDashboardUrl,
  getOrderUrl,
  getUpdateUrl,
} from '@/lib/url-helpers';

import { ALL_SECTIONS } from '../dashboard/constants';
import { DashboardContext } from '../dashboard/DashboardContext';
import { useWorkspace } from '../WorkspaceProvider';

import { SEARCH_ENTITY_RESULT_FIELDS, SearchEntity } from './filters';
import type { SearchEntityNodeMap, SearchHighlights } from './types';
import { useRecentlyVisited } from './useRecentlyVisited';

/**
 * Orders the nodes of a page by their explicit score (`scores` field of the search results), best first. Scores are
 * transported independently of highlights by every backend. Keeps the received order when a node has no score (e.g.
 * an older cached response) and between equal scores.
 */
export function sortNodesByScore<N extends { id?: string }>(
  nodes: N[] | undefined,
  scores: ReadonlyArray<{ id: string; score: number }> | undefined,
): N[] | undefined {
  if (!nodes || !scores?.length) {
    return nodes;
  }

  const scoreById = new Map(scores.map(({ id, score }) => [id, score]));
  if (!nodes.every(node => scoreById.has(node.id))) {
    return nodes;
  }

  return [...nodes].sort((a, b) => scoreById.get(b.id) - scoreById.get(a.id));
}

export function getHighlightsFields<T extends string>(
  highlights: SearchHighlights,
  topFields: readonly T[],
): {
  others: Record<string, string[]>;
  top: Record<T, string[]>;
} {
  const top: Record<string, string[]> = {};
  const others: Record<string, string[]> = {};

  if (highlights?.fields) {
    for (const [field, values] of Object.entries(highlights.fields)) {
      if (topFields.includes(field as T)) {
        top[field as T] = values;
      } else {
        others[field] = values;
      }
    }
  }

  return { top: top as Record<T, string[]>, others };
}

type SearchResultType<E extends keyof SearchEntityNodeMap = keyof SearchEntityNodeMap> = {
  entity: E;
  data: SearchEntityNodeMap[E];
};

type LinkPropsResult = {
  href: string;
  onClick?: () => void;
};

export function useGetLinkProps() {
  const { addToRecent } = useRecentlyVisited();
  const { LoggedInUser } = useLoggedInUser();
  const { workspace } = useWorkspace();
  const { getProfileUrl } = React.useContext(DashboardContext);

  const getLinkProps = useCallback(
    <E extends keyof SearchEntityNodeMap>({ entity, data }: SearchResultType<E>): LinkPropsResult => {
      const handlers: {
        [E in keyof SearchEntityNodeMap]: (data: SearchEntityNodeMap[E], entity: E) => LinkPropsResult;
      } = {
        [SearchEntity.ACCOUNTS]: (data, entity) => {
          const account = data;
          const peopleProfileLink = getProfileUrl(account);
          let href: string;
          if (account.type === CollectiveType.VENDOR && 'parent' in account && account.parent.slug === workspace.slug) {
            href = getDashboardRoute(workspace, `vendors/${account.id}`);
          } else if (peopleProfileLink) {
            href = peopleProfileLink;
          } else if (workspace.isHost && 'host' in account && workspace.slug === account.host?.slug) {
            href = getDashboardRoute(workspace, `hosted-collectives/${account.id}`);
          } else {
            href = getCollectivePageRoute(account);
          }
          return { href, onClick: () => addToRecent({ id: account.id, entity }) };
        },
        [SearchEntity.EXPENSES]: (data, entity) => {
          const expense = data;
          let href: string;
          if (workspace.slug === expense.account.slug) {
            href = getDashboardRoute(workspace, `expenses?openExpenseId=${expense.legacyId}`);
          } else if (workspace.slug === expense.payee?.slug) {
            href = getDashboardRoute(workspace, `submitted-expenses?openExpenseId=${expense.legacyId}`);
          } else if (workspace.isHost && 'host' in expense.account && workspace.slug === expense.account.host?.slug) {
            href = getDashboardRoute(workspace, `${ALL_SECTIONS.HOST_PAYMENT_REQUESTS}/${expense.legacyId}`);
          } else {
            href = getExpensePageUrl(expense);
          }
          return { href, onClick: () => addToRecent({ id: expense.id, entity }) };
        },
        [SearchEntity.TRANSACTIONS]: (data, entity) => {
          const transaction = data;
          let href: string;
          if (
            workspace?.slug === 'root-actions' ||
            (workspace?.isHost && 'host' in transaction && transaction.host?.slug === workspace.slug)
          ) {
            href = getDashboardRoute(workspace, `host-transactions?openTransactionId=${transaction.legacyId}`);
          } else if (transaction.account.slug === workspace.slug) {
            href = getDashboardRoute(workspace, `transactions?openTransactionId=${transaction.legacyId}`);
          } else if (LoggedInUser?.isRoot) {
            href = getDashboardRoute(
              { slug: 'root-actions' },
              `host-transactions?date=ALL&openTransactionId=${transaction.legacyId}`,
            );
          } else {
            href = `${getCollectivePageRoute(transaction.account)}/transactions?searchTerm=%23${transaction.legacyId}`;
          }
          return { href, onClick: () => addToRecent({ id: transaction.id, entity }) };
        },
        [SearchEntity.COMMENTS]: data => {
          const comment = data;
          return { href: getCommentUrl(comment as Comment, LoggedInUser) };
        },
        [SearchEntity.ORDERS]: (data, entity) => {
          const order = data;
          return {
            href: getOrderUrl(order as Order, LoggedInUser),
            onClick: () => addToRecent({ id: order.id, entity }),
          };
        },
        [SearchEntity.UPDATES]: (data, entity) => {
          const update = data;
          return {
            href: getUpdateUrl(update as Update, LoggedInUser),
            onClick: () => addToRecent({ id: update.id, entity }),
          };
        },
        [SearchEntity.HOST_APPLICATIONS]: (data, entity) => {
          const hostApplication = data;
          return {
            href: getHostApplicationDashboardUrl(hostApplication as HostApplication, LoggedInUser),
            onClick: () => addToRecent({ id: hostApplication.id, entity }),
          };
        },
        [SearchEntity.DASHBOARD_TOOL]: data => {
          const dashboardTool = data;
          return { href: getDashboardRoute(workspace, dashboardTool.section) };
        },
      };

      const handler = handlers[entity];
      return handler(data, entity);
    },
    [LoggedInUser, workspace, addToRecent, getProfileUrl],
  );

  return { getLinkProps };
}

/**
 * Errors to show for the selected tab: errors of other entities only affect their own tab count, so that one failing
 * entity (e.g. a search too broad for PostgreSQL) doesn't hide the results of the others. The "All" tab shows them all.
 */
export const getVisibleErrors = (
  error: ApolloError | undefined,
  entity: SearchEntity,
): Array<{ key: string; error: ApolloError | { graphQLErrors: GraphQLFormattedError[] } }> => {
  if (!error) {
    return [];
  } else if (!error.graphQLErrors?.length) {
    return [{ key: 'network', error }]; // Network error
  }

  const field = entity === SearchEntity.ALL ? null : SEARCH_ENTITY_RESULT_FIELDS[entity];
  return error.graphQLErrors
    .filter(graphQLError => {
      const [root, results, errorField] = graphQLError.path || [];
      const isEntityError = root === 'search' && results === 'results' && Boolean(errorField);
      return !field || !isEntityError || errorField === field;
    })
    .map(graphQLError => ({
      key: `${graphQLError.path?.join('.')}-${graphQLError.message}`,
      error: { graphQLErrors: [graphQLError] },
    }));
};
