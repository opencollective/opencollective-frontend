import React from 'react';
import PropTypes from 'prop-types';

import { Box } from '../Grid';
import { useLoggedInUser } from '../UserProvider';

import StepProfileGuestForm from './StepProfileGuestForm';
import StepProfileLoggedInForm from './StepProfileLoggedInForm';

const StepProfile = ({
  collective,
  stepDetails,
  defaultProfileSlug,
  defaultEmail,
  defaultName,
  onChange,
  data,
  canUseIncognito,
  onSignInClick,
  isEmbed,
}) => {
  const { LoggedInUser } = useLoggedInUser();
  return (
    <Box width={1}>
      {LoggedInUser ? (
        <StepProfileLoggedInForm
          defaultProfileSlug={defaultProfileSlug}
          onChange={onChange}
          canUseIncognito={canUseIncognito}
          collective={collective}
          data={data}
          stepDetails={stepDetails}
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
  defaultProfileSlug: PropTypes.string,
  defaultEmail: PropTypes.object,
  defaultName: PropTypes.object,
  canUseIncognito: PropTypes.bool,
  isEmbed: PropTypes.bool,
};

export default StepProfile;
