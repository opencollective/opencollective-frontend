import React from 'react';
import { useQuery } from '@apollo/client';
import { KeyRound, Plus } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { gql } from '../../lib/graphql/helpers';
import { getPersonalTokenSettingsRoute } from '../../lib/url-helpers';

import DateTime from '../DateTime';
import Link from '../Link';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import Pagination from '../Pagination';
import { DataTable } from '../table/DataTable';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

import CreatePersonalTokenModal from './CreatePersonalTokenModal';

const personalTokenQuery = gql`
  query PersonalTokens($slug: String!, $limit: Int, $offset: Int) {
    individual(slug: $slug) {
      id
      name
      slug
      type
      imageUrl(height: 128)
      personalTokens(limit: $limit, offset: $offset) {
        totalCount
        nodes {
          id
          publicId
          name
          scope
          expiresAt
        }
      }
    }
  }
`;

const PersonalTokensList = ({ account, onPersonalTokenCreated, offset = 0 }) => {
  const intl = useIntl();
  const variables = { slug: account.slug, limit: 12, offset: offset };
  const [showCreatePersonalToken, setShowCreatePersonalTokenModal] = React.useState(false);
  const { data, loading, error } = useQuery(personalTokenQuery, { variables });
  const tokens = data?.individual?.personalTokens;

  const columns = [
    {
      header: intl.formatMessage({ defaultMessage: 'Name', id: 'Fields.name' }),
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
            <KeyRound size={18} />
          </div>
          <div className="min-w-0">
            <Link
              href={getPersonalTokenSettingsRoute(data.individual, row.original)}
              className="font-medium text-foreground hover:underline"
            >
              {row.original.name ?? <FormattedMessage defaultMessage="Unnamed token" id="3IwVoe" />}
            </Link>
            {row.original.scope?.length > 0 && (
              <p className="truncate text-sm text-muted-foreground">
                <FormattedMessage
                  defaultMessage="Scopes: {scopes}"
                  id="kb8W30"
                  values={{ scopes: row.original.scope.join(', ') }}
                />
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'actions',
      meta: { align: 'right' },
      cell: ({ row }) => {
        const { expiresAt } = row.original;
        return (
          <div className="flex items-center justify-end gap-3">
            {expiresAt &&
              (new Date(expiresAt) < new Date() ? (
                <Badge type="error" size="sm">
                  <FormattedMessage defaultMessage="Expired" id="RahCRH" />
                </Badge>
              ) : (
                <span className="text-sm whitespace-nowrap text-muted-foreground">
                  <FormattedMessage
                    defaultMessage="Expires {date}"
                    id="/VQpyO"
                    values={{ date: <DateTime value={expiresAt} dateStyle="medium" /> }}
                  />
                </span>
              ))}
            <Button asChild size="xs" variant="outline">
              <Link href={getPersonalTokenSettingsRoute(data.individual, row.original)}>
                <FormattedMessage id="Settings" defaultMessage="Settings" />
              </Link>
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div data-cy="personal-tokens-list" className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-lg font-semibold">
            <FormattedMessage defaultMessage="Personal Tokens" id="IPdwXJ" />
          </h2>
          <p className="text-sm text-muted-foreground">
            <FormattedMessage
              defaultMessage="Personal tokens are used to authenticate with the API. They are not tied to a specific application."
              id="N2aQSA"
            />
          </p>
        </div>
        <Button
          data-cy="create-personal-token-btn"
          size="sm"
          variant="outline"
          className="shrink-0"
          disabled={!data?.individual}
          onClick={() => setShowCreatePersonalTokenModal(true)}
        >
          <Plus size={16} />
          <FormattedMessage defaultMessage="Create Personal token" id="MMyZfL" />
        </Button>
        {showCreatePersonalToken && (
          <CreatePersonalTokenModal
            account={data?.individual}
            onClose={() => setShowCreatePersonalTokenModal(false)}
            onSuccess={onPersonalTokenCreated}
            disabled={!data?.individual}
          />
        )}
      </div>
      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !loading && !tokens?.totalCount ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center">
          <KeyRound size={24} className="text-muted-foreground" />
          <p className="font-medium">
            <FormattedMessage defaultMessage="You don't have any token yet" id="1SzDWu" />
          </p>
        </div>
      ) : (
        <DataTable
          loading={loading}
          nbPlaceholders={3}
          data={tokens?.nodes}
          columns={columns}
          hideHeader
          mobileTableView
          getRowDataCy={() => 'personal-token'}
        />
      )}
      {tokens?.totalCount > variables.limit && (
        <div className="flex justify-center">
          <Pagination
            total={tokens.totalCount}
            limit={variables.limit}
            offset={variables.offset}
            ignoredQueryParams={['slug', 'section']}
          />
        </div>
      )}
    </div>
  );
};

export default PersonalTokensList;
