import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { Plus as PlusIcon } from '@styled-icons/fa-solid/Plus';
import { isEmpty, omit, omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { Agreement } from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';

import AgreementDrawer from '../agreements/AgreementDrawer';
import AgreementsTable from '../agreements/AgreementsTable';
import { AGREEMENT_VIEW_FIELDS_FRAGMENT } from '../agreements/fragments';
import CollectivePickerAsync from '../CollectivePickerAsync';
import FilesViewerModal from '../FilesViewerModal';
import { Flex } from '../Grid';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import Pagination from '../Pagination';
import StyledButton from '../StyledButton';
import { Span } from '../Text';

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

const selectedAccountInfoQuery = gql`
  query SelectedAccountInfo($account: String!) {
    account(slug: $account) {
      id
      legacyId
      name
      slug
      imageUrl
      ... on AccountWithHost {
        host {
          id
          slug
        }
      }
    }
  }
`;

const NB_AGREEMENTS_DISPLAYED = 10;

const IGNORED_QUERY_PARAMS = ['slug', 'section'];

const getVariablesFromQuery = query => {
  return {
    offset: parseInt(query.offset) || 0,
    limit: parseInt(query.limit) || NB_AGREEMENTS_DISPLAYED,
    account: query.account ? { slug: query.account } : undefined,
  };
};

const hasPagination = (data, queryVariables): boolean => {
  const totalCount = data?.host?.hostedAccountAgreements?.totalCount;
  return Boolean(queryVariables.offset || (totalCount && totalCount > NB_AGREEMENTS_DISPLAYED));
};

const HostDashboardAgreements = ({ hostSlug }) => {
  const router = useRouter();
  const intl = useIntl();
  const query = router.query;
  const { LoggedInUser, loadingLoggedInUser } = useLoggedInUser();
  const [agreementDrawerOpen, setAgreementDrawerOpen] = React.useState(false);
  const [agreementInDrawer, setAgreementInDrawer] = React.useState(null);
  const [agreementFilePreview, setAgreementFilePreview] = React.useState<Agreement | null>(null);
  const queryVariables = { hostSlug, ...getVariablesFromQuery(omitBy(query, isEmpty)) };
  const hasSelectedAccount = Boolean(queryVariables.account);
  const [selectedAccount, setSelectedAccount] = React.useState(undefined);
  const { data, previousData, error, loading, refetch } = useQuery(hostDashboardAgreementsQuery, {
    variables: queryVariables,
    context: API_V2_CONTEXT,
  });
  const { loading: selectedAccountLoading } = useQuery(selectedAccountInfoQuery, {
    skip: !hasSelectedAccount || selectedAccount, // Skip if no account selected or if already loaded
    variables: { account: queryVariables.account?.slug },
    context: API_V2_CONTEXT,
    onCompleted: data => {
      if (selectedAccount === undefined && data?.account?.host?.slug === hostSlug) {
        setSelectedAccount(data?.account);
      }
    },
  });

  const canEdit = Boolean(LoggedInUser && !LoggedInUser.isAccountantOnly(data?.host));
  return (
    <React.Fragment>
      <div className="flex flex-wrap justify-between gap-4">
        <h1 className="text-2xl font-bold leading-10 tracking-tight">
          <FormattedMessage id="Agreements" defaultMessage="Agreements" />
        </h1>
        <Flex alignItems="center" gridGap="16px" flexWrap="wrap">
          <CollectivePickerAsync
            inputId="agreements-account"
            data-cy="select-agreements-account"
            width="300px"
            styles={{ control: { borderRadius: '100px', padding: '3px 16px' } }}
            placeholder={intl.formatMessage({ defaultMessage: 'Filter by account' })}
            hostCollectiveIds={[data?.host?.legacyId]}
            isClearable
            collective={selectedAccount}
            loading={selectedAccountLoading}
            disabled={selectedAccountLoading}
            onChange={option => {
              const account = option?.value || null;
              setSelectedAccount(account);
              const newQuery = { ...omit(query, [...IGNORED_QUERY_PARAMS, 'offset']), account: account?.slug };
              router.push({ pathname: router.asPath.split('?')[0], query: newQuery });
            }}
          />
          {canEdit && (
            <StyledButton
              data-cy="btn-new-agreement"
              buttonStyle="primary"
              buttonSize="tiny"
              height="40px"
              disabled={loading || loadingLoggedInUser}
              onClick={() => {
                setAgreementInDrawer(null);
                setAgreementDrawerOpen(true);
              }}
            >
              <Span mr={2}>
                <FormattedMessage id="HostDashboardAgreements.New" defaultMessage="Add New" />
              </Span>
              <PlusIcon size={14} color="#FFFFFF" />
            </StyledButton>
          )}
        </Flex>
      </div>
      <hr className="my-5" />
      {error ? (
        <MessageBoxGraphqlError error={error} my={4} />
      ) : (
        <React.Fragment>
          <AgreementsTable
            agreements={data?.host.hostedAccountAgreements}
            loading={loading}
            nbPlaceholders={NB_AGREEMENTS_DISPLAYED}
            resetFilters={hasSelectedAccount && (() => router.push({ pathname: router.asPath.split('?')[0] }))}
            onFilePreview={setAgreementFilePreview}
            openAgreement={agreement => {
              setAgreementDrawerOpen(true);
              setAgreementInDrawer(agreement);
            }}
          />
          <AgreementDrawer
            open={agreementDrawerOpen}
            agreement={agreementInDrawer}
            canEdit={canEdit}
            hostLegacyId={data?.host.legacyId} // legacyId required by CollectivePickerAsync
            onClose={() => setAgreementDrawerOpen(false)}
            onCreate={() => {
              setAgreementDrawerOpen(false);
              refetch({ ...queryVariables, offset: 0 }); // Resetting offset to 0 since entries are displayed by creation date DESC
            }}
            onEdit={() => {
              // No need to refetch, local Apollo cache is updated automatically
              setAgreementDrawerOpen(false);
            }}
            onDelete={() => {
              setAgreementDrawerOpen(false);
              refetch(queryVariables);
            }}
            onFilePreview={() => setAgreementFilePreview(agreementInDrawer)}
          />
          <Flex my={4} justifyContent="center">
            {hasPagination(data || previousData, queryVariables) && (
              <Pagination
                variant="input"
                offset={queryVariables.offset}
                limit={queryVariables.limit}
                total={(data || previousData)?.host?.hostedAccountAgreements?.totalCount || 0}
                ignoredQueryParams={IGNORED_QUERY_PARAMS}
                isDisabled={loading}
              />
            )}
          </Flex>
        </React.Fragment>
      )}
      {agreementFilePreview && (
        <FilesViewerModal
          files={[agreementFilePreview.attachment]}
          openFileUrl={agreementFilePreview.attachment.url}
          onClose={() => setAgreementFilePreview(null)}
          parentTitle={`${agreementFilePreview.account.name} / ${agreementFilePreview.title}`}
        />
      )}
    </React.Fragment>
  );
};

export default HostDashboardAgreements;
