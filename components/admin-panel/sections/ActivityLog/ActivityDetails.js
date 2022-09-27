import React from 'react';
import PropTypes from 'prop-types';

import { CollectiveEditedDetails } from './CollectiveEditedDetails';

const ActivityDetailComponents = {
  COLLECTIVE_EDITED: CollectiveEditedDetails,
};

export const DETAILED_ACTIVITY_TYPES = Object.keys(ActivityDetailComponents);

const ActivityDetails = ({ activity }) => {
  const ActivityDetailsComponent = ActivityDetailComponents[activity.type];
  return ActivityDetailsComponent ? <ActivityDetailsComponent activity={activity} /> : null;
};

ActivityDetails.propTypes = {
  activity: PropTypes.shape({ type: PropTypes.string.isRequired, data: PropTypes.object }).isRequired,
};

export default ActivityDetails;
