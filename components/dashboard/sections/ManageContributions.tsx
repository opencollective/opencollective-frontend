import React from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';

import { manageContributionsQuery } from '../../recurring-contributions/graphql/queries';
import RecurringContributionsContainer from '../../recurring-contributions/RecurringContributionsContainer';
import { H2 } from '../../Text';
import { AdminSectionProps } from '../types';

const ManageContributions = ({ account }: AdminSectionProps) => {
  const { data, error, loading } = useQuery(manageContributionsQuery, {
    variables: { slug: account.slug },
    context: API_V2_CONTEXT,
  });
  const recurringContributions = data?.account?.orders || {};
  console.log({ error, loading, recurringContributions });

  return (
    <React.Fragment>
      <H2 fontSize="24px" fontWeight="700" lineHeight="32px" mb={3}>
        <FormattedMessage id="menu.subscriptions" defaultMessage="Manage Contributions" />
      </H2>
      <RecurringContributionsContainer
        recurringContributions={recurringContributions}
        account={account}
        isLoading={loading}
        displayFilters
      />
    </React.Fragment>
  );
};

export default ManageContributions;
