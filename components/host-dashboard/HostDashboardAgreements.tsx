import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { Plus as PlusIcon } from '@styled-icons/fa-solid/Plus';
import { isEmpty, omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import AgreementDrawer from '../agreements/AgreementDrawer';
import AgreementsTable from '../agreements/AgreementsTable';
import { AGREEMENT_VIEW_FIELDS_FRAGMENT } from '../agreements/fragments';
import { Box, Flex } from '../Grid';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import Pagination from '../Pagination';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import { H1, Span } from '../Text';

const hostDashboardAgreementsQuery = gql`
  query HostAgreements($hostSlug: String!, $limit: Int!, $offset: Int!, $accounts: [AccountReferenceInput]) {
    host(slug: $hostSlug) {
      id
      legacyId
      hostedAccountAgreements(limit: $limit, offset: $offset, accounts: $accounts) {
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

const IGNORED_QUERY_PARAMS = ['slug', 'section'];

const getVariablesFromQuery = query => {
  const accountIds = query.accountIds;
  return {
    offset: parseInt(query.offset) || 0,
    limit: parseInt(query.limit) || NB_AGREEMENTS_DISPLAYED,
    accounts: accountIds ? accountIds.split(',').map(id => ({ id })) : undefined,
  };
};

const hasPagination = (data, queryVariables): boolean => {
  const totalCount = data?.host?.hostedAccountAgreements?.totalCount;
  return Boolean(queryVariables.offset || (totalCount && totalCount > NB_AGREEMENTS_DISPLAYED));
};

const HostDashboardAgreements = ({ hostSlug }) => {
  const router = useRouter();
  const query = router.query;
  const [agreementDrawerOpen, setAgreementDrawerOpen] = React.useState(false);
  const [agreementInDrawer, setAgreementInDrawer] = React.useState(null);
  const queryVariables = { hostSlug, ...getVariablesFromQuery(omitBy(query, isEmpty)) };
  const { data, previousData, error, loading, refetch } = useQuery(hostDashboardAgreementsQuery, {
    variables: queryVariables,
    context: API_V2_CONTEXT,
  });

  return (
    <Box maxWidth={1000} m="0 auto" px={2}>
      <Flex mb={24} alignItems="center" flexWrap="wrap">
        <H1 fontSize="32px" lineHeight="40px" py={2} fontWeight="normal">
          <FormattedMessage id="Agreements" defaultMessage="Agreements" />
        </H1>
        <Box mx="auto" />
        <StyledButton
          buttonStyle="primary"
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
      </Flex>
      <StyledHr mb={26} borderWidth="0.5px" borderColor="black.300" />
      {error ? (
        <MessageBoxGraphqlError error={error} my={4} />
      ) : (
        <React.Fragment>
          <AgreementsTable
            agreements={data?.host.hostedAccountAgreements}
            loading={loading}
            nbPlaceholders={NB_AGREEMENTS_DISPLAYED}
            openAgreement={agreement => {
              setAgreementDrawerOpen(true);
              setAgreementInDrawer(agreement);
            }}
          />
          <AgreementDrawer
            open={agreementDrawerOpen}
            agreement={agreementInDrawer}
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
    </Box>
  );
};

export default HostDashboardAgreements;
