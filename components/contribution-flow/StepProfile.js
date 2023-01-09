import React from 'react';
import PropTypes from 'prop-types';

import useLoggedInUser from '../../lib/hooks/useLoggedInUser';

import { Box } from '../Grid';

import StepProfileGuestForm from './StepProfileGuestForm';
import StepProfileLoggedInForm from './StepProfileLoggedInForm';

const StepProfile = ({
  collective,
  stepDetails,
  profiles,
  defaultEmail,
  defaultName,
  onChange,
  data,
  onSignInClick,
  isEmbed,
}) => {
  const { LoggedInUser } = useLoggedInUser();
  return (
    <Box width={1}>
      {LoggedInUser ? (
        <StepProfileLoggedInForm
          profiles={profiles}
          onChange={onChange}
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
  collective: PropTypes.object,
  stepDetails: PropTypes.shape({
    amount: PropTypes.number,
    interval: PropTypes.string,
  }),
  data: PropTypes.object,
  onChange: PropTypes.func,
  onSignInClick: PropTypes.func,
  profiles: PropTypes.arrayOf(PropTypes.object),
  defaultEmail: PropTypes.string,
  defaultName: PropTypes.string,
  isEmbed: PropTypes.bool,
};

export default StepProfile;
