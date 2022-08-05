import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT, gqlV2 } from '../../../../lib/graphql/helpers';
import { ActivityLabelI18n } from '../../../../lib/i18n/activities';

import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import { Box, Flex } from '../../../Grid';
import LinkCollective from '../../../LinkCollective';
import Loading from '../../../Loading';
import MessageBox from '../../../MessageBox';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import StyledCard from '../../../StyledCard';
import StyledLink from '../../../StyledLink';
import { P } from '../../../Text';

const activityLogQuery = gqlV2/* GraphQL */ `
  query AccountActivityLog($account: AccountReferenceInput!) {
    activities(account: $account) {
      offset
      limit
      totalCount
      nodes {
        id
        createdAt
        type
        individual {
          id
          slug
          name
          type
          imageUrl(height: 48)
        }
      }
    }
  }
`;

const ActivityLogContainer = styled(StyledCard)`
  & > *:not(:last-child) {
    border-bottom: 1px solid #dcdde0;
  }
`;

const MetadataContainer = styled.div`
  display: flex;
  align-items: center;
  grid-gap: 8px;
  color: #4d4f51;
  margin-top: 10px;
`;

const ActivityLog = ({ accountSlug }) => {
  const intl = useIntl();
  const { data, loading, error } = useQuery(activityLogQuery, {
    variables: { account: { slug: accountSlug } },
    context: API_V2_CONTEXT,
  });

  return (
    <Box mt={3}>
      {loading ? (
        <Loading />
      ) : error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !data?.activities?.nodes ? (
        <MessageBox type="error" withIcon>
          <FormattedMessage
            id="mustBeAdmin"
            defaultMessage="You must be an admin of this collective to see this page"
          />
        </MessageBox>
      ) : !data.activities.totalCount ? (
        <MessageBox type="info" withIcon>
          <FormattedMessage defaultMessage="No activity yet" />
        </MessageBox>
      ) : (
        <ActivityLogContainer>
          {data.activities.nodes.map(activity => (
            <Box key={activity.id} px="16px" py="14px">
              <P color="black.900" fontWeight="500" fontSize="14px">
                {ActivityLabelI18n[activity.type]
                  ? intl.formatMessage(ActivityLabelI18n[activity.type])
                  : activity.type}
              </P>
              <MetadataContainer>
                <FormattedMessage
                  id="ByUser"
                  defaultMessage="By {userName}"
                  values={{
                    userName: !activity.individual ? (
                      <FormattedMessage id="user.unknown" defaultMessage="Unknown" />
                    ) : (
                      <StyledLink as={LinkCollective} color="black.700" collective={activity.individual}>
                        <Flex alignItems="center" gridGap="8px">
                          <Avatar radius={24} collective={activity.individual} />
                          {activity.individual.name}
                        </Flex>
                      </StyledLink>
                    ),
                  }}
                />
                •
                <DateTime value={activity.createdAt} dateStyle="medium" />
              </MetadataContainer>
            </Box>
          ))}
        </ActivityLogContainer>
      )}
    </Box>
  );
};

ActivityLog.propTypes = {
  accountSlug: PropTypes.string.isRequired,
};

export default ActivityLog;
