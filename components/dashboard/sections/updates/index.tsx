import React from 'react';
import { useQuery } from '@apollo/client';
import { toNumber, uniqBy } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { FilterComponentConfigs, FiltersToVariables, Views } from '../../../../lib/filters/filter-types';
import { integer } from '../../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import { Account, UpdatesDashboardQueryVariables } from '../../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { getDashboardRoute } from '../../../../lib/url-helpers';

import { StackedAvatars } from '../../../Avatar';
import EmojiReactions from '../../../conversations/EmojiReactions';
import HTMLContent from '../../../HTMLContent';
import Link from '../../../Link';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Button } from '../../../ui/Button';
import { Pagination } from '../../../ui/Pagination';
import { Skeleton } from '../../../ui/Skeleton';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import { Filterbar } from '../../filters/Filterbar';
import { orderByFilter } from '../../filters/OrderFilter';
import { searchFilter } from '../../filters/SearchFilter';
import { UPDATE_STATUS, updateStatusFilter } from '../../filters/UpdateStatusFilter';
import { DashboardSectionProps } from '../../types';

import { UpdateDate, UpdateStatus } from './common';
import { updatesDashboardMetadataQuery, updatesDashboardQuery } from './queries';
import SingleUpdateView from './SingleUpdateView';
import UpdateFormView from './UpdateFormView';
const PAGE_SIZE = 10;

const schema = z.object({
  limit: integer.default(PAGE_SIZE),
  offset: integer.default(0),
  orderBy: orderByFilter.schema,
  searchTerm: searchFilter.schema,
  status: updateStatusFilter.schema,
});

const UpdatePost = ({ update, account }) => {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border p-4">
      <div>
        <div className="flex justify-between">
          <Link href={getDashboardRoute(account, `updates/${update.id}`)} className="text-xl font-medium">
            {update.title}
          </Link>
          <UpdateStatus update={update} />
        </div>
        <div className="text-sm">
          <UpdateDate update={update} />
        </div>
      </div>
      {update.summary && <HTMLContent content={update.summary} />}
      <div className="flex flex-grow justify-between">
        <div>
          <EmojiReactions reactions={update.reactions} />
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <StackedAvatars
            accounts={
              uniqBy(
                update.comments?.nodes?.map(comment => comment.fromAccount),
                'id',
              ) as Partial<Account>[]
            }
            maxDisplayedAvatars={5}
            imageSize={24}
          />
          <FormattedMessage
            id="update.comments"
            defaultMessage="{count, plural,=0 {No comments} one {# comment} other {# comments}}"
            values={{ count: update.comments?.totalCount }}
          />
        </div>
      </div>
    </div>
  );
};

type FilterValues = z.infer<typeof schema>;

const filters: FilterComponentConfigs<FilterValues> = {
  searchTerm: searchFilter.filter,
  status: updateStatusFilter.filter,
};

const toVariables: FiltersToVariables<z.infer<typeof schema>, UpdatesDashboardQueryVariables> = {
  status: updateStatusFilter.toVariables,
};

const UpdatesList = () => {
  const { account } = React.useContext(DashboardContext);
  const intl = useIntl();
  const {
    data: metadata,
    loading: metadataLoading,
    error: metadataError,
  } = useQuery(updatesDashboardMetadataQuery, {
    variables: {
      slug: account.slug,
    },
    context: API_V2_CONTEXT,
  });

  const views: Views<z.infer<typeof schema>> = [
    {
      id: UPDATE_STATUS.PUBLISHED,
      label: intl.formatMessage({ defaultMessage: 'Published', id: 'update.status.published' }),
      count: metadata?.account?.PUBLISHED?.totalCount,
      filter: {
        status: UPDATE_STATUS.PUBLISHED,
      },
    },
    {
      id: UPDATE_STATUS.DRAFTED,
      label: intl.formatMessage({ defaultMessage: 'Drafts', id: 'update.tabs.drafts' }),
      count: metadata?.account?.DRAFTS?.totalCount,
      filter: {
        status: UPDATE_STATUS.DRAFTED,
      },
    },
  ];

  const queryFilter = useQueryFilter({
    schema,
    views,
    filters,
    toVariables,
  });
  const {
    data,
    previousData,
    loading: queryLoading,
    error: queryError,
  } = useQuery(updatesDashboardQuery, {
    variables: {
      slug: account.slug,
      ...queryFilter.variables,
    },
    context: API_V2_CONTEXT,
  });

  const loading = metadataLoading || queryLoading;
  const error = metadataError || queryError;

  const updates = data?.account?.updates;
  const { limit, offset } = queryFilter.values;
  const pages = Math.ceil(((data || previousData)?.account?.updates?.totalCount || 1) / limit);
  const currentPage = toNumber(offset + limit) / limit;

  return (
    <div className="flex max-w-screen-lg flex-col-reverse xl:flex-row">
      <div className="flex flex-1 flex-col gap-6">
        <DashboardHeader
          title={<FormattedMessage id="updates" defaultMessage="Updates" />}
          description={
            <FormattedMessage
              id="Dashboard.Updates.Subtitle"
              defaultMessage="Updates from your account that are visible to people following your account"
            />
          }
          actions={
            <Link href={getDashboardRoute(account, 'updates/new')}>
              <Button size="sm" className="gap-1.5">
                <FormattedMessage defaultMessage="Create Update" id="IWsAlq" />
              </Button>
            </Link>
          }
        />

        <Filterbar {...queryFilter} />
        <div className="order-1 space-y-6 xl:order-none xl:col-span-2 ">
          {error ? (
            <MessageBoxGraphqlError error={error} />
          ) : loading ? (
            // eslint-disable-next-line react/no-array-index-key
            Array.from({ length: 3 }).map((_, index) => <Skeleton className="h-4 w-80" key={index} />)
          ) : updates?.nodes.length === 0 ? (
            <EmptyResults
              hasFilters={queryFilter.hasFilters}
              entityType="UPDATES"
              onResetFilters={() => queryFilter.resetFilters({})}
            />
          ) : (
            <React.Fragment>
              {updates?.nodes?.map(update => <UpdatePost key={update.id} update={update} account={account} />)}
              <Pagination
                totalPages={pages}
                page={currentPage}
                onChange={page => queryFilter.setFilter('offset', (page - 1) * limit)}
              />
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
};

enum UpdateDashboardAction {
  EDIT = 'edit',
  NEW = 'new',
}

const Updates = ({ subpath }: DashboardSectionProps) => {
  const [action, id] = subpath;

  if (Object.values(UpdateDashboardAction).includes(action as UpdateDashboardAction)) {
    return <UpdateFormView updateId={action === UpdateDashboardAction.EDIT ? id : null} />;
  } else if (action) {
    return <SingleUpdateView updateId={action} />;
  } else {
    return <UpdatesList />;
  }
};

export default Updates;
