import React from 'react';
import { useQuery } from '@apollo/client';
import { AppWindow, Plus } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { gql } from '../../lib/graphql/helpers';
import { getOauthAppSettingsRoute } from '../../lib/url-helpers';

import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import CreateOauthApplicationModal from '../oauth/CreateOauthApplicationModal';
import Pagination from '../Pagination';
import { DataTable } from '../table/DataTable';
import { Button } from '../ui/Button';

const applicationsQuery = gql`
  query Applications($slug: String!, $limit: Int, $offset: Int) {
    account(slug: $slug) {
      id
      name
      slug
      type
      imageUrl(height: 128)
      oAuthApplications(limit: $limit, offset: $offset) {
        totalCount
        nodes {
          id
          publicId
          name
          description
        }
      }
    }
  }
`;

const OAuthApplicationsList = ({ account, onApplicationCreated, offset = 0 }) => {
  const intl = useIntl();
  const variables = { slug: account.slug, limit: 12, offset: offset };
  const [showCreateApplicationModal, setShowCreateApplicationModal] = React.useState(false);
  const { data, loading, error } = useQuery(applicationsQuery, { variables });
  const applications = data?.account?.oAuthApplications;

  const columns = [
    {
      header: intl.formatMessage({ defaultMessage: 'Name', id: 'Fields.name' }),
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
            <AppWindow size={18} />
          </div>
          <div className="min-w-0">
            <Link
              href={getOauthAppSettingsRoute(data.account, row.original)}
              className="font-medium text-foreground hover:underline"
            >
              {row.original.name}
            </Link>
            {row.original.description && (
              <p className="truncate text-sm text-muted-foreground">{row.original.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'actions',
      meta: { align: 'right' },
      cell: ({ row }) => (
        <Button asChild size="xs" variant="outline">
          <Link href={getOauthAppSettingsRoute(data.account, row.original)}>
            <FormattedMessage id="Settings" defaultMessage="Settings" />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div data-cy="oauth-apps-list" className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-lg font-semibold">
            <FormattedMessage defaultMessage="OAuth Apps" id="cGHrNj" />
          </h2>
          <p className="text-sm text-muted-foreground">
            <FormattedMessage
              defaultMessage="You can register new apps that you developed using Open Collective's API."
              id="p4WWnt"
            />{' '}
            <FormattedMessage
              defaultMessage="For more information about OAuth applications, check <link>our documentation</link>."
              id="dG3sDf"
              values={{
                link: getI18nLink({
                  href: 'https://documentation.opencollective.com/development/oauth',
                }),
              }}
            />
          </p>
        </div>
        <Button
          data-cy="create-app-btn"
          size="sm"
          variant="outline"
          className="shrink-0"
          disabled={!data?.account}
          onClick={() => setShowCreateApplicationModal(true)}
        >
          <Plus size={16} />
          <FormattedMessage defaultMessage="Create OAuth app" id="m6BfW0" />
        </Button>
        {showCreateApplicationModal && (
          <CreateOauthApplicationModal
            account={data.account}
            onClose={() => setShowCreateApplicationModal(false)}
            onSuccess={onApplicationCreated}
          />
        )}
      </div>
      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !loading && !applications?.totalCount ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center">
          <AppWindow size={24} className="text-muted-foreground" />
          <p className="font-medium">
            <FormattedMessage defaultMessage="You don't have any app yet" id="v8bmup" />
          </p>
          <p className="text-sm text-muted-foreground">
            <FormattedMessage
              defaultMessage="You can create apps that integrate with the Open Collective platform. <CreateAppLink>Create an app</CreateAppLink> using the Open Collective's API."
              id="1lIftz"
              values={{
                CreateAppLink: children => (
                  <button
                    type="button"
                    data-cy="create-app-link"
                    className="text-primary hover:underline"
                    onClick={() => setShowCreateApplicationModal(true)}
                  >
                    {children}
                  </button>
                ),
              }}
            />
          </p>
        </div>
      ) : (
        <DataTable
          loading={loading}
          nbPlaceholders={3}
          data={applications?.nodes}
          columns={columns}
          hideHeader
          mobileTableView
          getRowDataCy={() => 'oauth-app'}
        />
      )}
      {applications?.totalCount > variables.limit && (
        <div className="flex justify-center">
          <Pagination
            total={applications.totalCount}
            limit={variables.limit}
            offset={variables.offset}
            ignoredQueryParams={['slug', 'section']}
          />
        </div>
      )}
    </div>
  );
};

export default OAuthApplicationsList;
