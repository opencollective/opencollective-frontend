import React from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';

import { Dimensions } from '../../collective-page/_constants';
import SectionTitle from '../../collective-page/SectionTitle';
import Container from '../../Container';
import { Box } from '../../Grid';
import { manageContributionsQuery } from '../../recurring-contributions/graphql/queries';
import RecurringContributionsContainer from '../../recurring-contributions/RecurringContributionsContainer';
import { AdminSectionProps } from '../types';

const ManageContributions = ({ account }: AdminSectionProps) => {
  const { data, loading } = useQuery(manageContributionsQuery, {
    variables: { slug: account.slug },
    context: API_V2_CONTEXT,
  });
  const recurringContributions = data?.account?.orders || {};

  return (
    <React.Fragment>
      <Container position="relative" minHeight={[null, 800]}>
        <Box maxWidth={Dimensions.MAX_SECTION_WIDTH} m="0 auto" px={[2, 3, 4]} pb={3}>
          <SectionTitle textAlign="left" mb={4} display={['none', 'block']}>
            <FormattedMessage id="Contributions" defaultMessage="Contributions" />
          </SectionTitle>
          <RecurringContributionsContainer
            recurringContributions={recurringContributions}
            account={account}
            isLoading={loading}
            displayFilters
          />
        </Box>
      </Container>
    </React.Fragment>
  );
};

export default ManageContributions;
