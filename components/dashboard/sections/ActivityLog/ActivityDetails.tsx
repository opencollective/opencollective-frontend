import React from 'react';
import { isEmpty } from 'lodash';
import { defineMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import type { Activity } from '../../../../lib/graphql/types/v2/schema';

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
    title: defineMessage({ defaultMessage: 'Changes', id: 'dgqhUM' }),
    Component: GenericActivityDiffDataWithList,
  },
  COLLECTIVE_EDITED: {
    title: defineMessage({ defaultMessage: 'Changes', id: 'dgqhUM' }),
    Component: CollectiveEditedDetails,
  },
  VENDOR_EDITED: {
    title: defineMessage({ defaultMessage: 'Changes', id: 'dgqhUM' }),
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

interface ActivityDetailsProps {
  activity: {
    type: string;
    data?: object;
  };
}

const ActivityDetails = ({
  activity,
  TitleContainer
}: ActivityDetailsProps) => {
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

export default ActivityDetails;
