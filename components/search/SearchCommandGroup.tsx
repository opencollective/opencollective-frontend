import React, { useCallback } from 'react';
import { SearchIcon } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import type { useQueryFilterReturnType } from '@/lib/hooks/useQueryFilter';
import { i18nSearchEntity } from '@/lib/i18n/search';
import { PREVIEW_FEATURE_KEYS } from '@/lib/preview-features';
import { getDashboardRoute } from '@/lib/url-helpers';

import Link from '@/components/Link';
import { CommandGroup } from '@/components/ui/Command';

import { ALL_SECTIONS } from '../dashboard/constants';
import { useWorkspace } from '../WorkspaceProvider';

import { useGetLinkProps } from './lib';
import { SearchCommandItem } from './SearchCommandItem';
import type { SearchEntityNodeMap } from './types';

interface SeeMoreItemsCommandItemProps {
  onSelect: () => void;
  totalCount: number;
  limit: number;
  label: string;
}

const SeeMoreItemsCommandItem = React.memo<SeeMoreItemsCommandItemProps>(({ onSelect, totalCount, limit, label }) => {
  const intl = useIntl();
  if (totalCount > limit) {
    return (
      <SearchCommandItem onSelect={onSelect} className="items-center justify-start">
        <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <SearchIcon />
        </div>
        <span>
          <FormattedMessage
            defaultMessage="See {count} more {label}"
            id="SearchResults.SeeMore"
            values={{
              count: Number(totalCount - limit).toLocaleString(intl.locale),
              label: label.toLowerCase(),
            }}
          />
        </span>
      </SearchCommandItem>
    );
  }
  return null;
});

type SearchCommandGroupEntity = keyof SearchEntityNodeMap;

interface SearchResultItemProps<E extends SearchCommandGroupEntity> {
  node: SearchEntityNodeMap[E];
  entity: E;
  renderNode: (node: SearchEntityNodeMap[E]) => React.ReactNode;
  setOpen: (open: boolean) => void;
  getLinkProps: (params: { entity: E; data: SearchEntityNodeMap[E] }) => { href: string; onClick?: () => void };
}

function SearchResultItemInner<E extends SearchCommandGroupEntity>({
  node,
  entity,
  renderNode,
  setOpen,
  getLinkProps,
}: SearchResultItemProps<E>) {
  const router = useRouter();
  const { href, onClick } = getLinkProps({ entity, data: node });

  const handleSelect = useCallback(() => {
    onClick?.();
    router.push(href);
    setOpen(false);
  }, [router, href, setOpen, onClick]);

  return (
    <SearchCommandItem onSelect={handleSelect}>
      <Link href={href} className="block w-full">
        {renderNode(node)}
      </Link>
    </SearchCommandItem>
  );
}

const SearchResultItem = React.memo(SearchResultItemInner);

type SearchCommandGroupProps<E extends SearchCommandGroupEntity = SearchCommandGroupEntity> = {
  totalCount?: number;
  nodes?: SearchEntityNodeMap[E][];
  renderNode: (node: SearchEntityNodeMap[E]) => React.ReactNode;
  input: string;
  queryFilter: useQueryFilterReturnType<any, any>;
  entity: E;
  setOpen: (open: boolean) => void;
  isInfiniteScrollEnabled?: boolean;
};

export function SearchCommandGroup<E extends SearchCommandGroupEntity>({
  totalCount,
  nodes,
  renderNode,
  input,
  queryFilter,
  entity,
  setOpen,
  isInfiniteScrollEnabled = false,
}: SearchCommandGroupProps<E>) {
  const intl = useIntl();
  const { LoggedInUser } = useLoggedInUser();
  const isUsingSearchResultsPage = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SEARCH_RESULTS_PAGE);

  const { workspace } = useWorkspace();
  const { getLinkProps } = useGetLinkProps();

  const handleSeeMoreSelect = useCallback(() => {
    if (isUsingSearchResultsPage) {
      queryFilter.resetFilters(
        { ...queryFilter.values, entity },
        queryFilter.values.workspace ? getDashboardRoute(workspace, ALL_SECTIONS.SEARCH) : '/search-results',
      );
      setOpen(false);
    } else {
      queryFilter.setFilter('entity', entity);
    }
  }, [isUsingSearchResultsPage, queryFilter, entity, workspace, setOpen]);

  if (!totalCount || input === '') {
    return null;
  }

  const showSeeMore = !isInfiniteScrollEnabled && (nodes?.length || 0) < totalCount;
  return (
    <CommandGroup heading={i18nSearchEntity(intl, entity)} className="[&:last-child_.separator]:hidden">
      {nodes?.map(node => (
        <SearchResultItem
          key={node.id}
          node={node}
          entity={entity}
          renderNode={renderNode}
          setOpen={setOpen}
          getLinkProps={getLinkProps}
        />
      ))}
      {showSeeMore && (
        <SeeMoreItemsCommandItem
          onSelect={handleSeeMoreSelect}
          key={`more-${String(entity)}`}
          totalCount={totalCount}
          limit={queryFilter.variables.limit}
          label={i18nSearchEntity(intl, entity)}
        />
      )}
      <hr className="separator -mx-2 my-2 h-px bg-border" />
    </CommandGroup>
  );
}
