import React from 'react';
import { useQuery } from '@apollo/client';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import CollectivePickerAsync from '../CollectivePickerAsync';
import { Box } from '../Grid';
import LoadingPlaceholder from '../LoadingPlaceholder';
import { manageContributionsQuery } from '../recurring-contributions/graphql/queries';
import RecurringContributionsContainer from '../recurring-contributions/RecurringContributionsContainer';
import StyledInputField from '../StyledInputField';

const RecurringContributions = () => {
  const [account, setAccount] = React.useState(null);
  const { data, loading } = useQuery(manageContributionsQuery, {
    skip: !account,
    variables: { slug: account?.slug },
    context: API_V2_CONTEXT,
  });
  return (
    <Box my={4}>
      <StyledInputField htmlFor="recurring-contributions-account" label="Account" flex="1 1">
        {({ id }) => (
          <CollectivePickerAsync
            inputId={id}
            onChange={({ value }) => setAccount(value)}
            collective={account}
            skipGuests={false}
          />
        )}
      </StyledInputField>
      {loading ? (
        <LoadingPlaceholder height={400} />
      ) : (
        <Box my={4}>
          <RecurringContributionsContainer
            recurringContributions={data?.account?.orders}
            account={account}
            loading={loading}
            displayFilters
          />
        </Box>
      )}
    </Box>
  );
};

export default RecurringContributions;
