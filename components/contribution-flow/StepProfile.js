import React from 'react';
import PropTypes from 'prop-types';

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
          onChange={onChange}
          onSignInClick={onSignInClick}
          isEmbed={isEmbed}
          tier={tier}
        />
      )}
    </Box>
  );
};

StepProfile.propTypes = {
  collective: PropTypes.object,
  tier: PropTypes.object,
  stepDetails: PropTypes.shape({
    amount: PropTypes.number,
    interval: PropTypes.string,
  }),
  data: PropTypes.object,
  onChange: PropTypes.func,
  onSignInClick: PropTypes.func,
  profiles: PropTypes.arrayOf(PropTypes.object),
  isEmbed: PropTypes.bool,
};

export default StepProfile;
