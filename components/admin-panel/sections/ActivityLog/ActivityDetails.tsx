import React from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';
import { defineMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import type { Activity } from '../../../../lib/graphql/types/v2/graphql';

import { Box } from '../../../Grid';

import { CollectiveEditedDetails } from './CollectiveEditedDetails';
import { GenericActivityDiffDataWithList } from './GenericActivityDiffDataWithList';

const ValueContainer = styled.div`
  background: ${props => props.theme.colors.black[100]};
  padding: 12px;
  border-radius: 8px;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
`;

const ActivityDetailComponents = {
  ACCOUNTING_CATEGORIES_EDITED: {
    title: defineMessage({ defaultMessage: 'Changes' }),
    Component: GenericActivityDiffDataWithList,
  },
  COLLECTIVE_EDITED: {
    title: defineMessage({ defaultMessage: 'Changes' }),
    Component: CollectiveEditedDetails,
  },
  VENDOR_EDITED: {
    title: defineMessage({ defaultMessage: 'Changes' }),
    Component: CollectiveEditedDetails,
  },
  DEFAULT: {
    title: defineMessage({ id: 'Details', defaultMessage: 'Details' }),
    Component: ({ activity }) => <ValueContainer>{JSON.stringify(activity.data, null, 2)}</ValueContainer>,
  },
};

export const activityHasDetails = (activity: Activity) => {
  return activity.data && !isEmpty(activity.data);
};

const ActivityDetails = ({ activity, TitleContainer }) => {
  const intl = useIntl();
  const activityConfig = ActivityDetailComponents[activity.type] || ActivityDetailComponents.DEFAULT;
  return (
    <React.Fragment>
      {TitleContainer && <TitleContainer>{intl.formatMessage(activityConfig.title)}</TitleContainer>}
      <Box mt={2}>
        <activityConfig.Component activity={activity} />
      </Box>
    </React.Fragment>
  );
};

ActivityDetails.propTypes = {
  activity: PropTypes.shape({ type: PropTypes.string.isRequired, data: PropTypes.object }).isRequired,
};

export default ActivityDetails;
