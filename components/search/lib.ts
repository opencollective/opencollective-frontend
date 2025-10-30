import { useCallback } from 'react';

import { CollectiveType } from '@/lib/constants/collectives';
import type {
  SearchAccountFieldsFragment,
  SearchCommentFieldsFragment,
  SearchExpenseFieldsFragment,
  SearchOrderFieldsFragment,
  SearchTransactionFieldsFragment,
  SearchUpdateFieldsFragment,
} from '@/lib/graphql/types/v2/graphql';
import type { Comment, Order, Update } from '@/lib/graphql/types/v2/schema';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import {
  getCollectivePageRoute,
  getCommentUrl,
  getDashboardRoute,
  getExpensePageUrl,
  getOrderUrl,
  getUpdateUrl,
} from '@/lib/url-helpers';

import { useWorkspace } from '../WorkspaceProvider';

import type { SearchHighlights } from './types';
import type { PageVisit } from './useRecentlyVisited';
import { useRecentlyVisited } from './useRecentlyVisited';
import { ALL_SECTIONS } from '../dashboard/constants';
import { PREVIEW_FEATURE_KEYS } from '@/lib/preview-features';
import { DashboardContext } from '../dashboard/DashboardContext';
import React from 'react';
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

export function useGetLinkProps() {
  const { addToRecent } = useRecentlyVisited();
  const { LoggedInUser } = useLoggedInUser();
  const { workspace } = useWorkspace();
  const { getProfileUrl } = React.useContext(DashboardContext);
  const getLinkProps = useCallback(
    ({
      type,
      data,
    }:
      | PageVisit
      | {
          type: 'page';
          data: { section: string };
        }) => {
      let href: string;
      let onClick: () => void;
      switch (type) {
        case 'account': {
          const account = data as SearchAccountFieldsFragment;
          const peopleProfileLink = getProfileUrl(account);
          if (account.type === CollectiveType.VENDOR && 'parent' in account && account.parent.slug === workspace.slug) {
            href = getDashboardRoute(workspace, `vendors/${account.id}`);
          } else if (peopleProfileLink) {
            href = peopleProfileLink;
          } else if (workspace.isHost && 'host' in account && workspace.slug === account.host.slug) {
            href = getDashboardRoute(workspace, `hosted-collectives/${account.id}`);
          } else {
            href = getCollectivePageRoute(data as { slug: string });
          }
          onClick = () => addToRecent({ key: data.slug.toString(), type, data });
          break;
        }
        case 'expense': {
          const expense = data as SearchExpenseFieldsFragment;

          if (workspace.slug === expense.account.slug) {
            href = getDashboardRoute(workspace, `expenses?openExpenseId=${expense.legacyId}`);
          } else if (workspace.slug === expense.payee?.slug) {
            href = getDashboardRoute(workspace, `submitted-expenses?openExpenseId=${expense.legacyId}`);
          } else if (workspace.isHost && 'host' in expense.account && workspace.slug === expense.account?.host?.slug) {
            href = getDashboardRoute(workspace, `host-expenses?openExpenseId=${expense.legacyId}`);
          } else {
            href = getExpensePageUrl(expense);
          }

          onClick = () => addToRecent({ key: expense.legacyId.toString(), type, data });
          break;
        }
        case 'transaction': {
          const transaction = data as SearchTransactionFieldsFragment;
          if (
            workspace?.slug === 'root-actions' ||
            (workspace?.isHost && 'host' in transaction && transaction.host.slug === workspace.slug)
          ) {
            href = getDashboardRoute(workspace, `host-transactions?openTransactionId=${transaction.legacyId}`);
          } else if (transaction.account.slug === workspace.slug) {
            href = getDashboardRoute(workspace, `transactions?openTransactionId=${transaction.legacyId}`);
          } else {
            // No URL for platform transactions yet, however these should not appear
            href = undefined;
          }

          onClick = () => addToRecent({ key: transaction.legacyId.toString(), type, data });
          break;
        }
        case 'comment': {
          const comment = data as SearchCommentFieldsFragment;
          href = getCommentUrl(comment as Comment, LoggedInUser);
          break;
        }
        case 'order': {
          const order = data as SearchOrderFieldsFragment;
          href = getOrderUrl(order as Order, LoggedInUser);
          onClick = () => addToRecent({ key: data.legacyId.toString(), type, data });
          break;
        }
        case 'update': {
          const update = data as SearchUpdateFieldsFragment;
          href = getUpdateUrl(update as Update, LoggedInUser);
          onClick = () => addToRecent({ key: data.legacyId.toString(), type, data });
          break;
        }
        case 'page':
          href = `/dashboard/${workspace.slug}/${data.section}`;
          break;
      }
      return { href, onClick };
    },
    [LoggedInUser, workspace, addToRecent, getProfileUrl],
  );

  return { getLinkProps };
}
