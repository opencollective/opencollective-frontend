import { CollectiveType } from '@/lib/constants/collectives';
import type { SearchHighlights } from './types';
import { PageVisit, useRecentlyVisited } from './useRecentlyVisited';
import { useRouter } from 'next/router';
import {
  getCollectivePageRoute,
  getCommentUrl,
  getDashboardRoute,
  getExpensePageUrl,
  getOrderUrl,
  getUpdateUrl,
} from '@/lib/url-helpers';
import { DashboardContext } from '../dashboard/DashboardContext';
import React, { useCallback } from 'react';
import type { Comment, Expense, Order, Update } from '@/lib/graphql/types/v2/schema';
import { useWorkspace } from '../WorkspaceProvider';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';

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
  const { account } = React.useContext(DashboardContext);
  const { workspace } = useWorkspace();
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
        case 'account':
          if (data.type === CollectiveType.VENDOR) {
            if (data.parentCollective.slug === workspace.slug) {
              // TODO: missing query param for vendor drawer
              href = getDashboardRoute(workspace, `vendors/${data.slug}`);
            }
            // missing general pattern, maybe never occurs?
            href = '';
          } else {
            href = getCollectivePageRoute(data as { slug: string });
          }
          onClick = () => addToRecent({ key: data.slug.toString(), type, data });
          break;
        case 'expense':
          // TODO: handle within dashboard:
          // - host-expenses
          // - received expenses
          // - submitted expenses
          href = getExpensePageUrl(data as Expense);
          onClick = () => addToRecent({ key: data.legacyId.toString(), type, data });
          break;
        case 'transaction':
          if (account?.slug === 'root-actions' || account?.isHost) {
            href = `/dashboard/${account.slug}/host-transactions?openTransactionId=${data.legacyId}`;
          } else if (workspace.slug) {
            href = `/dashboard/${workspace.slug}/transactions?openTransactionId=${data.legacyId}`;
          } else {
            // handle platform transactions?
            href = undefined;
          }

          onClick = () => addToRecent({ key: data.legacyId.toString(), type, data });
          break;
        case 'comment':
          href = getCommentUrl(data as Comment, LoggedInUser);
          break;
        case 'order':
          href = getOrderUrl(data as Order, LoggedInUser);
          onClick = () => addToRecent({ key: data.legacyId.toString(), type, data });
          break;
        case 'update':
          href = getUpdateUrl(data as Update, LoggedInUser);
          onClick = () => addToRecent({ key: data.legacyId.toString(), type, data });
          break;
        case 'page':
          href = `/dashboard/${workspace.slug}/${data.section}`;
          break;
      }
      return { href, onClick };
    },
    [LoggedInUser, account, workspace, addToRecent],
  );

  return { getLinkProps };
}
