import React from 'react';
import { useQuery } from '@apollo/client';
import { PlusIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '../../../lib/filters/filter-types';
import { integer } from '../../../lib/filters/schemas';
import { API_V2_CONTEXT, gql } from '../../../lib/graphql/helpers';
import type { Agreement, HostAgreementsQueryVariables } from '../../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';
import useQueryFilter from '../../../lib/hooks/useQueryFilter';

import AgreementDrawer from '../../agreements/AgreementDrawer';
import AgreementsTable from '../../agreements/AgreementsTable';
import { AGREEMENT_VIEW_FIELDS_FRAGMENT } from '../../agreements/fragments';
import FilesViewerModal from '../../FilesViewerModal';
import { Flex } from '../../Grid';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import Pagination from '../../Pagination';
import { Button } from '../../ui/Button';
import DashboardHeader from '../DashboardHeader';
import { EmptyResults } from '../EmptyResults';
import { Filterbar } from '../filters/Filterbar';
import { hostedAccountFilter } from '../filters/HostedAccountFilter';
import type { DashboardSectionProps } from '../types';

const hostDashboardAgreementsQuery = gql`
  query HostAgreements($hostSlug: String!, $limit: Int!, $offset: Int!, $account: [AccountReferenceInput]) {
    host(slug: $hostSlug) {
      id
      legacyId
      slug
      hostedAccountAgreements(limit: $limit, offset: $offset, accounts: $account) {
        totalCount
        nodes {
          id
          ...AgreementViewFields
        }
      }
    }
  }
  ${AGREEMENT_VIEW_FIELDS_FRAGMENT}
`;

const NB_AGREEMENTS_DISPLAYED = 10;

const schema = z.object({
  limit: integer.default(NB_AGREEMENTS_DISPLAYED),
  offset: integer.default(0),
  account: hostedAccountFilter.schema,
});

const toVariables: FiltersToVariables<z.infer<typeof schema>, HostAgreementsQueryVariables> = {
  account: hostedAccountFilter.toVariables,
};

type FilterMeta = {
  hostSlug: string;
};

const filters: FilterComponentConfigs<z.infer<typeof schema>, FilterMeta> = {
  account: hostedAccountFilter.filter,
};

const IGNORED_QUERY_PARAMS = ['slug', 'section'];

const hasPagination = (data, queryVariables): boolean => {
  const totalCount = data?.host?.hostedAccountAgreements?.totalCount;
  return Boolean(queryVariables.offset || (totalCount && totalCount > NB_AGREEMENTS_DISPLAYED));
};

const HostDashboardAgreements = ({ accountSlug: hostSlug }: DashboardSectionProps) => {
  const { LoggedInUser, loadingLoggedInUser } = useLoggedInUser();
  const [agreementDrawerOpen, setAgreementDrawerOpen] = React.useState(false);
  const [agreementInDrawer, setAgreementInDrawer] = React.useState(null);
  const [agreementFilePreview, setAgreementFilePreview] = React.useState<Agreement | null>(null);

  const queryFilter = useQueryFilter({
    filters,
    schema,
    toVariables,
    meta: { hostSlug },
  });

  const { data, previousData, error, variables, loading, refetch } = useQuery(hostDashboardAgreementsQuery, {
    variables: { hostSlug, ...queryFilter.variables },
    context: API_V2_CONTEXT,
  });

  const canEdit = Boolean(LoggedInUser && !LoggedInUser.isAccountantOnly(data?.host));
  return (
    <div className="flex max-w-screen-lg flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage id="Agreements" defaultMessage="Agreements" />}
        actions={
          canEdit && (
            <Button
              data-cy="btn-new-agreement"
              className="gap-1"
              size="sm"
              disabled={loading || loadingLoggedInUser}
              onClick={() => {
                setAgreementInDrawer(null);
                setAgreementDrawerOpen(true);
              }}
            >
              <span>
                <FormattedMessage id="HostDashboardAgreements.New" defaultMessage="Add New" />
              </span>
              <PlusIcon size={20} />
            </Button>
          )
        }
      />

      <Filterbar {...queryFilter} />

      {error ? (
        <MessageBoxGraphqlError error={error} my={4} />
      ) : !loading && !data?.host.hostedAccountAgreements?.nodes?.length ? (
        <EmptyResults
          hasFilters={queryFilter.hasFilters}
          entityType="AGREEMENTS"
          onResetFilters={() => queryFilter.resetFilters({})}
        />
      ) : (
        <React.Fragment>
          <AgreementsTable
            agreements={data?.host.hostedAccountAgreements}
            loading={loading}
            nbPlaceholders={NB_AGREEMENTS_DISPLAYED}
            resetFilters={() => queryFilter.resetFilters({})}
            onFilePreview={setAgreementFilePreview}
            openAgreement={agreement => {
              setAgreementDrawerOpen(true);
              setAgreementInDrawer(agreement);
            }}
          />

          <Flex my={4} justifyContent="center">
            {hasPagination(data || previousData, variables) && (
              <Pagination
                variant="input"
                offset={variables.offset}
                limit={variables.limit}
                total={(data || previousData)?.host?.hostedAccountAgreements?.totalCount || 0}
                ignoredQueryParams={IGNORED_QUERY_PARAMS}
                isDisabled={loading}
              />
            )}
          </Flex>
        </React.Fragment>
      )}
      <AgreementDrawer
        open={agreementDrawerOpen}
        agreement={agreementInDrawer}
        canEdit={canEdit}
        hostLegacyId={data?.host.legacyId} // legacyId required by CollectivePickerAsync
        onClose={() => setAgreementDrawerOpen(false)}
        onCreate={() => {
          setAgreementDrawerOpen(false);
          refetch({ ...variables, offset: 0 }); // Resetting offset to 0 since entries are displayed by creation date DESC
        }}
        onEdit={() => {
          // No need to refetch, local Apollo cache is updated automatically
          setAgreementDrawerOpen(false);
        }}
        onDelete={() => {
          setAgreementDrawerOpen(false);
          refetch(variables);
        }}
      />
      {agreementFilePreview && (
        <FilesViewerModal
          files={[agreementFilePreview.attachment]}
          openFileUrl={agreementFilePreview.attachment.url}
          onClose={() => setAgreementFilePreview(null)}
          parentTitle={`${agreementFilePreview.account.name} / ${agreementFilePreview.title}`}
        />
      )}
    </div>
  );
};

export default HostDashboardAgreements;
