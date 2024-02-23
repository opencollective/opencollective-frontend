import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import type { Activity } from '../../../../lib/graphql/types/v2/graphql';

import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import { Drawer, DrawerHeader } from '../../../Drawer';
import LinkCollective from '../../../LinkCollective';
import StyledTag from '../../../StyledTag';
import { InfoList, InfoListItem, InfoListItemTitle } from '../../../ui/InfoList';

import ActivityDescription from './ActivityDescription';
import ActivityDetails, { activityHasDetails } from './ActivityDetails';
import { ActivityUser } from './ActivityUser';

type ActivityDrawerProps = {
  open: boolean;
  activity?: Activity | null;
  onClose: () => void;
};

const ACCOUNT_KEYS = ['fromAccount', 'account', 'host'] as const;

const AccountKeysI18n = defineMessages({
  fromAccount: {
    defaultMessage: 'From',
  },
  account: {
    id: 'To',
    defaultMessage: 'To',
  },
  host: {
    id: 'Member.Role.HOST',
    defaultMessage: 'Host',
  },
});

export default function ActivityDetailsDrawer({ activity, onClose }: ActivityDrawerProps) {
  const intl = useIntl();
  return (
    <Drawer open={Boolean(activity)} onClose={onClose} data-cy="activity-drawer">
      {Boolean(activity) && (
        <div>
          <DrawerHeader
            title={
              <FormattedMessage
                defaultMessage="Activity <ActivityId></ActivityId>"
                values={{
                  ActivityId: () => (
                    <StyledTag display="inline-block" verticalAlign="middle" ml={2} fontSize="12px">
                      #{activity.id.split('-')[0]}
                    </StyledTag>
                  ),
                }}
              />
            }
            onClose={onClose}
          />

          <InfoList className="sm:grid-cols-2">
            <InfoListItem
              title={<FormattedMessage id="Tags.USER" defaultMessage="User" />}
              value={<ActivityUser activity={activity} />}
            />

            <InfoListItem
              className="sm:col-span-2"
              title={<FormattedMessage id="Fields.description" defaultMessage="Description" />}
              value={<ActivityDescription activity={activity} />}
            />

            <InfoListItem
              className="sm:col-span-2"
              title={<FormattedMessage id="expense.incurredAt" defaultMessage="Date" />}
              value={<DateTime value={activity.createdAt} timeStyle="long" />}
            />

            {ACCOUNT_KEYS.map(accountKey => {
              const account = activity[accountKey];
              if (!account) {
                return null;
              }

              return (
                <InfoListItem
                  key={accountKey}
                  title={intl.formatMessage(AccountKeysI18n[accountKey])}
                  value={
                    <LinkCollective
                      collective={account}
                      className="flex items-center gap-2 font-medium hover:underline"
                    >
                      <Avatar collective={account} radius={24} /> {account.name}
                    </LinkCollective>
                  }
                />
              );
            })}
            {activityHasDetails(activity) && (
              <InfoListItem
                className="sm:col-span-2"
                value={<ActivityDetails activity={activity} TitleContainer={InfoListItemTitle} />}
              />
            )}
          </InfoList>
        </div>
      )}
    </Drawer>
  );
}
