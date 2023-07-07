import React from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';

import Container from '../../Container';
import { Box } from '../../Grid';
import { manageContributionsQuery } from '../../recurring-contributions/graphql/queries';
import RecurringContributionsContainer from '../../recurring-contributions/RecurringContributionsContainer';
import { H1 } from '../../Text';
import { AdminSectionProps } from '../types';

const ManageContributions = ({ account }: AdminSectionProps) => {
  const { data, loading } = useQuery(manageContributionsQuery, {
    variables: { slug: account.slug },
    context: API_V2_CONTEXT,
  });
  const recurringContributions = data?.account?.orders || {};

  return (
    <Container minHeight={[null, 800]}>
      <H1 fontSize="24px" lineHeight="32px" fontWeight={700} color="black.900" letterSpacing="-.025em">
        <FormattedMessage id="menu.subscriptions" defaultMessage="Manage Contributions" />
      </H1>
      <Box py={'32px'}>
        <RecurringContributionsContainer
          recurringContributions={recurringContributions}
          account={account}
          isLoading={loading}
          displayFilters
        />
      </Box>
    </Container>
  );
};

export default ManageContributions;
