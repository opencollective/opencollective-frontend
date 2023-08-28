import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { Activity } from '../../../../lib/graphql/types/v2/graphql';

import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import Drawer from '../../../Drawer';
import { Box, Flex } from '../../../Grid';
import LinkCollective from '../../../LinkCollective';
import StyledHr from '../../../StyledHr';
import StyledLink from '../../../StyledLink';
import StyledTag from '../../../StyledTag';
import { H4, P } from '../../../Text';

import ActivityDescription from './ActivityDescription';
import ActivityDetails, { activityHasDetails } from './ActivityDetails';
import { ActivityUser } from './ActivityUser';

type ActivityDrawerProps = {
  open: boolean;
  activity?: Activity | null;
  onClose: () => void;
};

const ColumTitle = styled.p`
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  text-transform: uppercase;
  color: #4d4f51;
  margin: 0;
  margin-bottom: 6px;
`;

const Value = styled(P)`
  font-style: normal;
  font-weight: 700;
  font-size: 14px;
  line-height: 20px;
  color: ${props => props.theme.colors.black[700]};
`;

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
    <Drawer maxWidth="512px" open={Boolean(activity)} onClose={onClose} showActionsContainer data-cy="activity-drawer">
      {Boolean(activity) && (
        <Box fontSize="14px">
          <H4 fontSize="20px" fontWeight="700">
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
          </H4>
          <Box mt={30}>
            <ColumTitle>
              <FormattedMessage id="Tags.USER" defaultMessage="User" />
            </ColumTitle>
            <Value>
              <ActivityUser activity={activity} />
            </Value>
          </Box>
          <Flex flexWrap="wrap" gridGap={24} mt={30}>
            <Box>
              <ColumTitle>
                <FormattedMessage id="Fields.description" defaultMessage="Description" />
              </ColumTitle>
              <Value py="2px">
                <ActivityDescription activity={activity} />
              </Value>
            </Box>
          </Flex>
          <Flex flexWrap="wrap" gridGap={24} mt={30}>
            <Box>
              <ColumTitle>
                <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />
              </ColumTitle>
              <Value py="2px">
                <DateTime value={activity.createdAt} timeStyle="long" />
              </Value>
            </Box>
          </Flex>

          <Flex flexWrap="wrap" gridGap={24} mt={30}>
            {ACCOUNT_KEYS.map(accountKey => {
              const account = activity[accountKey];
              if (!account) {
                return null;
              }

              return (
                <Box key={accountKey}>
                  <ColumTitle>{intl.formatMessage(AccountKeysI18n[accountKey])}</ColumTitle>
                  <Value>
                    <Flex alignItems="center" gridGap={2}>
                      <Avatar collective={account} radius={24} />
                      <StyledLink
                        as={LinkCollective}
                        collective={account}
                        color="black.700"
                        truncateOverflow
                        textDecoration="underline"
                      />
                    </Flex>
                  </Value>
                </Box>
              );
            })}
          </Flex>

          {activityHasDetails(activity) && (
            <React.Fragment>
              <StyledHr mt="32px" mb="16px" borderColor="black.300" />
              <Box fontSize="13px">
                <ActivityDetails activity={activity} TitleContainer={ColumTitle} />
              </Box>
            </React.Fragment>
          )}
        </Box>
      )}
    </Drawer>
  );
}
