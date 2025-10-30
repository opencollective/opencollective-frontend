import { useCallback } from 'react';

import { CollectiveType } from '@/lib/constants/collectives';
import type { SearchAccountFieldsFragment, SearchExpenseFieldsFragment } from '@/lib/graphql/types/v2/graphql';
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
          if (account.type === CollectiveType.VENDOR) {
            if (data.parentCollective.slug === workspace.slug) {
              // TODO: missing query param for vendor drawer
              href = getDashboardRoute(workspace, `vendors/${data.slug}`);
            }
            // missing general pattern, maybe never occurs?
            href = '';
          } else if (LoggedInUser.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.PEOPLE_DASHBOARD)) {
            href = getDashboardRoute(workspace); // TODO: people link
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

          onClick = () => addToRecent({ key: expense.legacyId.toString(), type, data: expense });
          break;
        }
        case 'transaction':
          if (workspace?.slug === 'root-actions' || workspace?.isHost) {
            href = `/dashboard/${workspace.slug}/host-transactions?openTransactionId=${data.legacyId}`;
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
    [LoggedInUser, workspace, addToRecent],
  );

  return { getLinkProps };
}
