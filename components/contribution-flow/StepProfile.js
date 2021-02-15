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
  defaultEmail,
  defaultName,
  onChange,
  data,
  canUseIncognito,
  onSignInClick,
  isEmbed,
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
        <StepProfileGuestForm
          stepDetails={stepDetails}
          data={data}
          onChange={onChange}
          onSignInClick={onSignInClick}
          defaultEmail={defaultEmail}
          defaultName={defaultName}
          isEmbed={isEmbed}
        />
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
  defaultEmail: PropTypes.object,
  defaultName: PropTypes.object,
  profiles: PropTypes.array,
  canUseIncognito: PropTypes.bool,
  isEmbed: PropTypes.bool,
};

export default withUser(StepProfile);
