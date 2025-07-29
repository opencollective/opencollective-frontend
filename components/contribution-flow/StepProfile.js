import React from 'react';

import useLoggedInUser from '../../lib/hooks/useLoggedInUser';

import { Box } from '../Grid';

import StepProfileGuestForm from './StepProfileGuestForm';
import StepProfileLoggedInForm from './StepProfileLoggedInForm';

const StepProfile = ({ collective, tier, stepDetails, profiles, onChange, data, onSignInClick, isEmbed }) => {
  const { LoggedInUser } = useLoggedInUser();
  return (
    <Box width={1}>
      {LoggedInUser ? (
        <StepProfileLoggedInForm
          profiles={profiles}
          onChange={onChange}
          collective={collective}
          tier={tier}
          data={data}
          stepDetails={stepDetails}
        />
      ) : (
        <StepProfileGuestForm
          stepDetails={stepDetails}
          data={data}
          collective={collective}
          onChange={onChange}
          onSignInClick={onSignInClick}
          isEmbed={isEmbed}
          tier={tier}
        />
      )}
    </Box>
  );
};

export default StepProfile;
