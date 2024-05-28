import React from 'react';
import { omit } from 'lodash';
import { useRouter } from 'next/router';

import CollectivePickerAsync from '../CollectivePickerAsync';
import ActivityLog from '../dashboard/sections/ActivityLog';
import { Box } from '../Grid';
import StyledInputField from '../StyledInputField';

const RootActivityLog = () => {
  const router = useRouter();
  const accountSlug = router.query.account;

  const handleAccountChange = ({ value }) => {
    const basePath = router.asPath.split('?')[0];
    router.push(
      {
        pathname: basePath,
        query: { ...omit(router.query, ['slug', 'section']), account: value.slug },
      },
      null,
      { scroll: false },
    );
  };

  return (
    <Box my={4}>
      <StyledInputField htmlFor="activity-log-account" label="Account" flex="1 1">
        {({ id }) => (
          <CollectivePickerAsync
            inputId={id}
            onChange={handleAccountChange}
            collective={{ slug: accountSlug }}
            skipGuests={false}
          />
        )}
      </StyledInputField>
      {accountSlug && <ActivityLog accountSlug={accountSlug} />}
    </Box>
  );
};

export default RootActivityLog;
