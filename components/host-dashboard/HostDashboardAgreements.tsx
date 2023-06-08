import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { isEmpty, omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import AgreementDrawer from '../agreements/AgreementDrawer';
import AgreementsList from '../agreements/AgreementsList';
import { Box, Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import { H1 } from '../Text';

const hostDashboardAgreementsQuery = gql`
  query HostAgreements($hostSlug: String!, $limit: Int!, $offset: Int!, $accounts: [AccountReferenceInput]) {
    host(slug: $hostSlug) {
      id
      legacyId
      hostedAccountAgreements(limit: $limit, offset: $offset, accounts: $accounts) {
        totalCount
        nodes {
          id
          title
          expiresAt
          account {
            id
            legacyId
            slug
            imageUrl
            name
          }
          attachment {
            id
            url
          }
        }
      }
    }
  }
`;

const NB_AGREEMENTS_DISPLAYED = 10;

const getVariablesFromQuery = query => {
  const accountIds = query.accountIds;
  return {
    offset: parseInt(query.offset) || 0,
    limit: (parseInt(query.limit) || NB_AGREEMENTS_DISPLAYED) * 2,
    accounts: accountIds ? accountIds.split(',').map(id => ({ id })) : undefined,
  };
};

const HostDashboardAgreements = ({ hostSlug, isDashboard }) => {
  const router = useRouter();
  const query = router.query;
  const [agreementDrawerOpen, setAgreementDrawerOpen] = React.useState(false);
  const [agreementInDrawer, setAgreementInDrawer] = React.useState(null);
  //  const pageRoute = isDashboard ? `/dashboard/${hostSlug}/host-agreements` : `/${hostSlug}/admin/host-agreements`;
  const queryVariables = { hostSlug, ...getVariablesFromQuery(omitBy(query, isEmpty)) };
  const { data, error, loading } = useQuery(hostDashboardAgreementsQuery, {
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
          onClick={() => {
            setAgreementInDrawer(null);
            setAgreementDrawerOpen(true);
          }}
        >
          New Agreement
        </StyledButton>
      </Flex>
      <StyledHr mb={26} borderWidth="0.5px" borderColor="black.300" />
      <AgreementDrawer
        open={agreementDrawerOpen}
        onClose={() => setAgreementDrawerOpen(false)}
        agreement={agreementInDrawer}
        hostLegacyId={data?.host.legacyId} // legacyId required by CollectivePickerAsync
      />
      <AgreementsList
        agreements={data?.host.hostedAccountAgreements}
        error={error}
        loading={loading}
        openAgreement={agreement => {
          setAgreementDrawerOpen(true);
          setAgreementInDrawer(agreement);
        }}
      />
    </Box>
  );
};

export default HostDashboardAgreements;
