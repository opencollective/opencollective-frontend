import React from 'react';
import PropTypes from 'prop-types';

import { Box } from '../Grid';
import { withUser } from '../UserProvider';

import StepProfileGuestForm from './StepProfileGuestForm';
import StepProfileLoggedInForm from './StepProfileLoggedInForm';

const StepProfile = ({
  LoggedInUser,
  collective,
  stepDetails,
  profiles,
  defaultSelectedProfile,
  onChange,
  data,
  canUseIncognito,
  onSignInClick,
}) => {
  return (
    <Box width={1}>
      {LoggedInUser ? (
        <StepProfileLoggedInForm
          profiles={profiles}
          defaultSelectedProfile={defaultSelectedProfile}
          onChange={onChange}
          canUseIncognito={canUseIncognito}
          collective={collective}
          data={data}
        />
      ) : (
        <StepProfileGuestForm stepDetails={stepDetails} data={data} onChange={onChange} onSignInClick={onSignInClick} />
      )}
    </Box>
  );
};

StepProfile.propTypes = {
  LoggedInUser: PropTypes.object,
  collective: PropTypes.object,
  stepDetails: PropTypes.shape({
    amount: PropTypes.number,
    interval: PropTypes.string,
  }),
  data: PropTypes.object,
  onChange: PropTypes.func,
  onSignInClick: PropTypes.func,
  defaultSelectedProfile: PropTypes.object,
  profiles: PropTypes.array,
  canUseIncognito: PropTypes.bool,
};

export default withUser(StepProfile);
