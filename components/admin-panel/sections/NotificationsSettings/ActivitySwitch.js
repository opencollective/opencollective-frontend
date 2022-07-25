import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { ActivityClasses, ActivityTypes } from '../../../../lib/constants/activities';
import { API_V2_CONTEXT, gqlV2 } from '../../../../lib/graphql/helpers';

import InputSwitch from '../../../InputSwitch';
import { TOAST_TYPE, useToasts } from '../../../ToastProvider';

import { accountActivitySubscriptionsFragment } from './fragments';

const refetchEmailNotificationQuery = gqlV2/* GraphQL */ `
  query NotificationsSettingsRefetchQuery($id: String!) {
    account(id: $id) {
      id
      ...AccountActivitySubscriptionsFields
    }
  }
  ${accountActivitySubscriptionsFragment}
`;

const setEmailNotificationMutation = gqlV2/* GraphQL */ `
  mutation SetEmailNotification($type: ActivityAndClassesType!, $account: AccountReferenceInput, $active: Boolean!) {
    setEmailNotification(type: $type, account: $account, active: $active) {
      id
    }
  }
`;

const ActivitySwitch = ({ account, activityType }) => {
  const { addToast } = useToasts();
  const existingSetting = account.activitySubscriptions?.find(
    notification =>
      ActivityClasses[activityType] === notification.type || notification.type === ActivityTypes.ACTIVITY_ALL,
  );
  const isIndeterminate =
    activityType === 'ACTIVITY_ALL' &&
    account.activitySubscriptions?.some(notification => notification.type !== ActivityTypes.ACTIVITY_ALL);
  const subscribed = existingSetting ? existingSetting.active : true;
  const isOverridedByAll = activityType !== 'ACTIVITY_ALL' && existingSetting?.type === ActivityTypes.ACTIVITY_ALL;

  const [setEmailNotification] = useMutation(setEmailNotificationMutation, {
    context: API_V2_CONTEXT,
    refetchQueries: [{ query: refetchEmailNotificationQuery, variables: { id: account.id }, context: API_V2_CONTEXT }],
  });

  const handleToggle = async variables => {
    try {
      await setEmailNotification({ variables });
    } catch (e) {
      addToast({
        type: TOAST_TYPE.ERROR,
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
    <InputSwitch
      name={`${activityType}-switch`}
      checked={subscribed}
      disabled={isIndeterminate || isOverridedByAll}
      onChange={event =>
        handleToggle({ type: activityType, account: { id: account.id }, active: event.target.checked })
      }
    />
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
