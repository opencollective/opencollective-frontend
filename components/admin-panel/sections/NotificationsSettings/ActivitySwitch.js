import React from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation } from '@apollo/client';
import { Info } from '@styled-icons/feather/Info';
import { FormattedMessage, useIntl } from 'react-intl';

import { ActivityClasses, ActivityTypes } from '../../../../lib/constants/activities';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import { ActivityClassesI18N } from '../../../../lib/i18n/activities-classes';

import { Box, Flex } from '../../../Grid';
import StyledTooltip from '../../../StyledTooltip';
import { Switch } from '../../../ui/Switch';
import { useToast } from '../../../ui/useToast';

import { accountActivitySubscriptionsFragment } from './fragments';

const refetchEmailNotificationQuery = gql`
  query NotificationsSettingsRefetchQuery($id: String!) {
    account(id: $id) {
      id
      ...AccountActivitySubscriptionsFields
    }
  }
  ${accountActivitySubscriptionsFragment}
`;

const setEmailNotificationMutation = gql`
  mutation SetEmailNotification($type: ActivityAndClassesType!, $account: AccountReferenceInput, $active: Boolean!) {
    setEmailNotification(type: $type, account: $account, active: $active) {
      id
    }
  }
`;

const ActivitySwitch = ({ account, activityType }) => {
  const { toast } = useToast();
  const intl = useIntl();
  const existingSetting = account.activitySubscriptions?.find(
    notification =>
      ActivityClasses[activityType] === notification.type || notification.type === ActivityTypes.ACTIVITY_ALL,
  );
  const isResetingSettings =
    activityType === 'ACTIVITY_ALL' &&
    account.activitySubscriptions
      ?.filter(notification => notification.type !== ActivityTypes.ACTIVITY_ALL)
      .map(notification =>
        ActivityClassesI18N[`${notification.type}.title`]
          ? intl.formatMessage(ActivityClassesI18N[`${notification.type}.title`])
          : notification.type,
      );
  const [isSubscribed, setSubscribed] = React.useState(existingSetting ? existingSetting.active : true);
  const isOverridedByAll = activityType !== 'ACTIVITY_ALL' && existingSetting?.type === ActivityTypes.ACTIVITY_ALL;

  const [setEmailNotification] = useMutation(setEmailNotificationMutation, {
    context: API_V2_CONTEXT,
    refetchQueries: [{ query: refetchEmailNotificationQuery, variables: { id: account.id }, context: API_V2_CONTEXT }],
  });

  const handleToggle = async variables => {
    try {
      setSubscribed(variables.active);
      await setEmailNotification({ variables });
    } catch (e) {
      toast({
        variant: 'error',
        message: (
          <FormattedMessage
            id="NotificationsSettings.ToggleError"
            defaultMessage="Error updating activity {activity}: {error}"
            values={{
              activity: activityType,
              error: e.message,
            }}
          />
        ),
      });
    }
  };

  return (
    <Flex alignItems="center">
      {isResetingSettings?.length > 0 ? (
        <StyledTooltip
          content={() => (
            <FormattedMessage
              id="NotificationsSettings.ToggleResetSettings"
              defaultMessage="By toggling this setting, you're also reseting previously set options for: {activities}"
              values={{ activities: isResetingSettings.join(', ') }}
            />
          )}
        >
          <Info size={16} />
        </StyledTooltip>
      ) : (
        <Box width="16px" />
      )}
      <Switch
        name={`${activityType}-switch`}
        checked={isSubscribed}
        disabled={isOverridedByAll}
        onCheckedChange={checked => handleToggle({ type: activityType, account: { id: account.id }, active: checked })}
      />
    </Flex>
  );
};

ActivitySwitch.propTypes = {
  account: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    slug: PropTypes.string,
    type: PropTypes.string,
    imageUrl: PropTypes.string,
    activitySubscriptions: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
        active: PropTypes.bool,
      }),
    ),
  }),
  activityType: PropTypes.string,
};

export default ActivitySwitch;
