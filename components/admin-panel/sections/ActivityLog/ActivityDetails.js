import React from 'react';
import PropTypes from 'prop-types';

import { ActivityTypes } from '../../../../lib/constants/activities';

export const DETAILED_ACTIVITY_TYPES = [ActivityTypes.COLLECTIVE_EDITED];

const ActivityDetails = ({ activity }) => {
  if (!DETAILED_ACTIVITY_TYPES.includes(activity.type)) {
    return null;
  }

  return <div>ActivityDetails</div>;
};

ActivityDetails.propTypes = {
  activity: PropTypes.shape({ type: PropTypes.string.isRequired }).isRequired,
};

export default ActivityDetails;
